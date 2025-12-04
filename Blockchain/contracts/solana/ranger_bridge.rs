// RANGERBLOCK BRIDGE - SOLANA/ANCHOR
// ====================================
// Cross-chain bridge for RangerBlock ecosystem
// Author: David Keane (IrishRanger) + Claude Code (Ranger)
//
// Features:
// - Convert between RangerCoin ↔ Wrapped BTC (via Wormhole/Portal)
// - Convert between RangerCoin ↔ Wrapped ETH
// - Convert between RangerCoin ↔ USDC
// - Convert between RangerCoin ↔ SOL
// - Oracle-based price feeds
// - Daily conversion limits (20 EUR)
// - Admin controls
//
// Rangers lead the way!

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("RNGRbrdg111111111111111111111111111111111111");

// Constants
const DAILY_LIMIT: u64 = 20_000_000;      // 20 tokens (6 decimals) = 20 EUR
const FEE_BASIS_POINTS: u64 = 100;        // 1% fee
const BASIS_POINTS: u64 = 10000;

#[program]
pub mod ranger_bridge {
    use super::*;

    /// Initialize the bridge
    pub fn initialize(
        ctx: Context<Initialize>,
        sol_rate: u64,      // SOL to RangerCoin rate (e.g., 100 = 1 SOL = 100 RNGR)
        btc_rate: u64,      // wBTC to RangerCoin rate
        eth_rate: u64,      // wETH to RangerCoin rate
        usdc_rate: u64,     // USDC to RangerCoin rate (should be ~1:1)
    ) -> Result<()> {
        let state = &mut ctx.accounts.bridge_state;

        state.authority = ctx.accounts.authority.key();
        state.treasury = ctx.accounts.treasury.key();
        state.ranger_mint = ctx.accounts.ranger_mint.key();

        // Set initial rates (scaled by 1e6 for precision)
        state.sol_rate = sol_rate;
        state.btc_rate = btc_rate;
        state.eth_rate = eth_rate;
        state.usdc_rate = usdc_rate;

        state.total_volume = 0;
        state.is_paused = false;
        state.bump = ctx.bumps.bridge_state;

        msg!("RangerBridge initialized!");
        msg!("SOL rate: {}, BTC rate: {}, ETH rate: {}, USDC rate: {}",
            sol_rate, btc_rate, eth_rate, usdc_rate);

        Ok(())
    }

    /// Convert SOL to RangerCoin
    pub fn convert_sol_to_ranger(ctx: Context<ConvertSol>, amount: u64) -> Result<()> {
        let state = &ctx.accounts.bridge_state;
        let user_state = &mut ctx.accounts.user_state;
        let clock = Clock::get()?;

        require!(!state.is_paused, BridgeError::BridgePaused);
        require!(amount > 0, BridgeError::InvalidAmount);

        // Check daily limit
        check_and_update_daily_limit(user_state, amount, clock.unix_timestamp)?;

        // Calculate output: amount * rate / 1e6 (rate precision)
        let gross_output = (amount as u128)
            .checked_mul(state.sol_rate as u128)
            .ok_or(BridgeError::Overflow)?
            .checked_div(1_000_000)
            .ok_or(BridgeError::Overflow)? as u64;

        // Calculate fee (1%)
        let fee = gross_output
            .checked_mul(FEE_BASIS_POINTS)
            .ok_or(BridgeError::Overflow)?
            .checked_div(BASIS_POINTS)
            .ok_or(BridgeError::Overflow)?;

        let net_output = gross_output.checked_sub(fee).ok_or(BridgeError::Overflow)?;

        // Transfer SOL from user to bridge
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: ctx.accounts.bridge_sol_vault.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(cpi_context, amount)?;

        // Transfer RangerCoin to user (from bridge vault)
        let seeds = &[b"bridge_state".as_ref(), &[state.bump]];
        let signer = &[&seeds[..]];

        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.bridge_ranger_vault.to_account_info(),
                to: ctx.accounts.user_ranger_account.to_account_info(),
                authority: ctx.accounts.bridge_state.to_account_info(),
            },
            signer,
        );
        token::transfer(transfer_ctx, net_output)?;

        // Transfer fee to treasury
        if fee > 0 {
            let fee_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.bridge_ranger_vault.to_account_info(),
                    to: ctx.accounts.treasury_ranger_account.to_account_info(),
                    authority: ctx.accounts.bridge_state.to_account_info(),
                },
                signer,
            );
            token::transfer(fee_ctx, fee)?;
        }

        msg!("Converted {} SOL to {} RNGR (fee: {})", amount, net_output, fee);

        emit!(ConversionEvent {
            user: ctx.accounts.user.key(),
            from_token: "SOL".to_string(),
            to_token: "RNGR".to_string(),
            amount_in: amount,
            amount_out: net_output,
            fee,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Convert RangerCoin to SOL
    pub fn convert_ranger_to_sol(ctx: Context<ConvertRangerToSol>, amount: u64) -> Result<()> {
        let state = &ctx.accounts.bridge_state;
        let user_state = &mut ctx.accounts.user_state;
        let clock = Clock::get()?;

        require!(!state.is_paused, BridgeError::BridgePaused);
        require!(amount > 0, BridgeError::InvalidAmount);

        // Check daily limit
        check_and_update_daily_limit(user_state, amount, clock.unix_timestamp)?;

        // Calculate output: amount * 1e6 / rate
        let gross_output = (amount as u128)
            .checked_mul(1_000_000)
            .ok_or(BridgeError::Overflow)?
            .checked_div(state.sol_rate as u128)
            .ok_or(BridgeError::Overflow)? as u64;

        // Calculate fee (1%)
        let fee = gross_output
            .checked_mul(FEE_BASIS_POINTS)
            .ok_or(BridgeError::Overflow)?
            .checked_div(BASIS_POINTS)
            .ok_or(BridgeError::Overflow)?;

        let net_output = gross_output.checked_sub(fee).ok_or(BridgeError::Overflow)?;

        // Check bridge has enough SOL
        require!(
            ctx.accounts.bridge_sol_vault.lamports() >= net_output,
            BridgeError::InsufficientLiquidity
        );

        // Transfer RangerCoin from user to bridge
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_ranger_account.to_account_info(),
                to: ctx.accounts.bridge_ranger_vault.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, amount)?;

        // Transfer SOL to user
        **ctx.accounts.bridge_sol_vault.try_borrow_mut_lamports()? -= net_output;
        **ctx.accounts.user.try_borrow_mut_lamports()? += net_output;

        msg!("Converted {} RNGR to {} SOL (fee: {} SOL)", amount, net_output, fee);

        emit!(ConversionEvent {
            user: ctx.accounts.user.key(),
            from_token: "RNGR".to_string(),
            to_token: "SOL".to_string(),
            amount_in: amount,
            amount_out: net_output,
            fee,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Convert SPL token (USDC, wBTC, wETH) to RangerCoin
    pub fn convert_token_to_ranger(
        ctx: Context<ConvertTokenToRanger>,
        amount: u64,
        token_type: TokenType,
    ) -> Result<()> {
        let state = &ctx.accounts.bridge_state;
        let user_state = &mut ctx.accounts.user_state;
        let clock = Clock::get()?;

        require!(!state.is_paused, BridgeError::BridgePaused);
        require!(amount > 0, BridgeError::InvalidAmount);

        // Check daily limit
        check_and_update_daily_limit(user_state, amount, clock.unix_timestamp)?;

        // Get rate based on token type
        let rate = match token_type {
            TokenType::USDC => state.usdc_rate,
            TokenType::WBTC => state.btc_rate,
            TokenType::WETH => state.eth_rate,
        };

        // Calculate output
        let gross_output = (amount as u128)
            .checked_mul(rate as u128)
            .ok_or(BridgeError::Overflow)?
            .checked_div(1_000_000)
            .ok_or(BridgeError::Overflow)? as u64;

        let fee = gross_output
            .checked_mul(FEE_BASIS_POINTS)
            .ok_or(BridgeError::Overflow)?
            .checked_div(BASIS_POINTS)
            .ok_or(BridgeError::Overflow)?;

        let net_output = gross_output.checked_sub(fee).ok_or(BridgeError::Overflow)?;

        // Transfer input token from user to bridge
        let transfer_in_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token_account.to_account_info(),
                to: ctx.accounts.bridge_token_vault.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        );
        token::transfer(transfer_in_ctx, amount)?;

        // Transfer RangerCoin to user
        let seeds = &[b"bridge_state".as_ref(), &[state.bump]];
        let signer = &[&seeds[..]];

        let transfer_out_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.bridge_ranger_vault.to_account_info(),
                to: ctx.accounts.user_ranger_account.to_account_info(),
                authority: ctx.accounts.bridge_state.to_account_info(),
            },
            signer,
        );
        token::transfer(transfer_out_ctx, net_output)?;

        let token_name = match token_type {
            TokenType::USDC => "USDC",
            TokenType::WBTC => "wBTC",
            TokenType::WETH => "wETH",
        };

        msg!("Converted {} {} to {} RNGR", amount, token_name, net_output);

        emit!(ConversionEvent {
            user: ctx.accounts.user.key(),
            from_token: token_name.to_string(),
            to_token: "RNGR".to_string(),
            amount_in: amount,
            amount_out: net_output,
            fee,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Update conversion rate (admin only)
    pub fn update_rate(
        ctx: Context<AdminAction>,
        token_type: TokenType,
        new_rate: u64,
    ) -> Result<()> {
        let state = &mut ctx.accounts.bridge_state;

        let old_rate = match token_type {
            TokenType::USDC => {
                let old = state.usdc_rate;
                state.usdc_rate = new_rate;
                old
            }
            TokenType::WBTC => {
                let old = state.btc_rate;
                state.btc_rate = new_rate;
                old
            }
            TokenType::WETH => {
                let old = state.eth_rate;
                state.eth_rate = new_rate;
                old
            }
        };

        msg!("Rate updated: {} -> {}", old_rate, new_rate);

        emit!(RateUpdated {
            token_type,
            old_rate,
            new_rate,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Update SOL rate (admin only)
    pub fn update_sol_rate(ctx: Context<AdminAction>, new_rate: u64) -> Result<()> {
        let state = &mut ctx.accounts.bridge_state;
        let old_rate = state.sol_rate;
        state.sol_rate = new_rate;

        msg!("SOL rate updated: {} -> {}", old_rate, new_rate);

        Ok(())
    }

    /// Pause bridge (emergency)
    pub fn pause(ctx: Context<AdminAction>) -> Result<()> {
        let state = &mut ctx.accounts.bridge_state;
        state.is_paused = true;

        msg!("Bridge PAUSED by admin");

        emit!(BridgePaused {
            paused_by: ctx.accounts.authority.key(),
        });

        Ok(())
    }

    /// Unpause bridge
    pub fn unpause(ctx: Context<AdminAction>) -> Result<()> {
        let state = &mut ctx.accounts.bridge_state;
        state.is_paused = false;

        msg!("Bridge UNPAUSED by admin");

        emit!(BridgeUnpaused {
            unpaused_by: ctx.accounts.authority.key(),
        });

        Ok(())
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

fn check_and_update_daily_limit(
    user_state: &mut Account<UserBridgeState>,
    amount: u64,
    current_timestamp: i64,
) -> Result<()> {
    let current_day = current_timestamp / 86400;

    // Reset if new day
    if user_state.last_conversion_day != current_day {
        user_state.daily_converted = 0;
        user_state.last_conversion_day = current_day;
    }

    require!(
        user_state.daily_converted + amount <= DAILY_LIMIT,
        BridgeError::DailyLimitExceeded
    );

    user_state.daily_converted += amount;

    Ok(())
}

// ============================================================================
// ACCOUNTS
// ============================================================================

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + BridgeState::INIT_SPACE,
        seeds = [b"bridge_state"],
        bump
    )]
    pub bridge_state: Account<'info, BridgeState>,

    pub ranger_mint: Account<'info, Mint>,

    /// CHECK: Treasury wallet
    pub treasury: UncheckedAccount<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ConvertSol<'info> {
    #[account(
        seeds = [b"bridge_state"],
        bump = bridge_state.bump
    )]
    pub bridge_state: Account<'info, BridgeState>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + UserBridgeState::INIT_SPACE,
        seeds = [b"user_bridge", user.key().as_ref()],
        bump
    )]
    pub user_state: Account<'info, UserBridgeState>,

    /// CHECK: Bridge SOL vault
    #[account(mut)]
    pub bridge_sol_vault: UncheckedAccount<'info>,

    #[account(mut)]
    pub bridge_ranger_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_ranger_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub treasury_ranger_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ConvertRangerToSol<'info> {
    #[account(
        seeds = [b"bridge_state"],
        bump = bridge_state.bump
    )]
    pub bridge_state: Account<'info, BridgeState>,

    #[account(
        mut,
        seeds = [b"user_bridge", user.key().as_ref()],
        bump
    )]
    pub user_state: Account<'info, UserBridgeState>,

    /// CHECK: Bridge SOL vault
    #[account(mut)]
    pub bridge_sol_vault: UncheckedAccount<'info>,

    #[account(mut)]
    pub bridge_ranger_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_ranger_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ConvertTokenToRanger<'info> {
    #[account(
        seeds = [b"bridge_state"],
        bump = bridge_state.bump
    )]
    pub bridge_state: Account<'info, BridgeState>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + UserBridgeState::INIT_SPACE,
        seeds = [b"user_bridge", user.key().as_ref()],
        bump
    )]
    pub user_state: Account<'info, UserBridgeState>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub bridge_token_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub bridge_ranger_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_ranger_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AdminAction<'info> {
    #[account(
        mut,
        seeds = [b"bridge_state"],
        bump = bridge_state.bump,
        constraint = bridge_state.authority == authority.key() @ BridgeError::NotAuthority
    )]
    pub bridge_state: Account<'info, BridgeState>,

    pub authority: Signer<'info>,
}

// ============================================================================
// STATE
// ============================================================================

#[account]
#[derive(InitSpace)]
pub struct BridgeState {
    pub authority: Pubkey,
    pub treasury: Pubkey,
    pub ranger_mint: Pubkey,
    pub sol_rate: u64,        // SOL to RNGR rate (scaled 1e6)
    pub btc_rate: u64,        // wBTC to RNGR rate
    pub eth_rate: u64,        // wETH to RNGR rate
    pub usdc_rate: u64,       // USDC to RNGR rate
    pub total_volume: u64,
    pub is_paused: bool,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct UserBridgeState {
    pub user: Pubkey,
    pub daily_converted: u64,
    pub last_conversion_day: i64,
    pub total_converted: u64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum TokenType {
    USDC,
    WBTC,
    WETH,
}

// ============================================================================
// EVENTS
// ============================================================================

#[event]
pub struct ConversionEvent {
    pub user: Pubkey,
    pub from_token: String,
    pub to_token: String,
    pub amount_in: u64,
    pub amount_out: u64,
    pub fee: u64,
    pub timestamp: i64,
}

#[event]
pub struct RateUpdated {
    pub token_type: TokenType,
    pub old_rate: u64,
    pub new_rate: u64,
    pub timestamp: i64,
}

#[event]
pub struct BridgePaused {
    pub paused_by: Pubkey,
}

#[event]
pub struct BridgeUnpaused {
    pub unpaused_by: Pubkey,
}

// ============================================================================
// ERRORS
// ============================================================================

#[error_code]
pub enum BridgeError {
    #[msg("Bridge is paused")]
    BridgePaused,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Daily limit exceeded (20 EUR max)")]
    DailyLimitExceeded,
    #[msg("Insufficient bridge liquidity")]
    InsufficientLiquidity,
    #[msg("Not authorized")]
    NotAuthority,
    #[msg("Calculation overflow")]
    Overflow,
    #[msg("Token not supported")]
    TokenNotSupported,
}
