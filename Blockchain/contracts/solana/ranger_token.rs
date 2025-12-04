// RANGERBLOCK TOKEN - SOLANA/ANCHOR (SPL Token Wrapper)
// ======================================================
// Custom token for RangerBlock ecosystem with transfer controls
// Author: David Keane (IrishRanger) + Claude Code (Ranger)
//
// Features:
// - Mint/burn controls
// - Transfer limits (20 EUR/day cap)
// - Admin freeze capability
// - Integration with registration status
//
// Rangers lead the way!

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer, MintTo, Burn};

declare_id!("RNGRtkn1111111111111111111111111111111111111");

// Constants
const DAILY_TRANSFER_LIMIT: u64 = 20_000_000; // 20 tokens (with 6 decimals) = 20 EUR equivalent
const DECIMALS: u8 = 6;

#[program]
pub mod ranger_token {
    use super::*;

    /// Initialize the RangerToken program
    pub fn initialize(
        ctx: Context<Initialize>,
        name: String,
        symbol: String,
        max_supply: u64,
    ) -> Result<()> {
        let state = &mut ctx.accounts.token_state;

        state.authority = ctx.accounts.authority.key();
        state.mint = ctx.accounts.mint.key();
        state.name = name.clone();
        state.symbol = symbol.clone();
        state.max_supply = max_supply;
        state.total_minted = 0;
        state.is_frozen = false;
        state.daily_limit = DAILY_TRANSFER_LIMIT;
        state.bump = ctx.bumps.token_state;

        msg!("RangerToken initialized!");
        msg!("Name: {}, Symbol: {}", name, symbol);
        msg!("Max supply: {}", max_supply);

        Ok(())
    }

    /// Mint tokens to a user (admin only)
    pub fn mint_tokens(ctx: Context<MintTokens>, amount: u64) -> Result<()> {
        let state = &mut ctx.accounts.token_state;

        require!(!state.is_frozen, TokenError::TokenFrozen);
        require!(
            state.total_minted + amount <= state.max_supply,
            TokenError::ExceedsMaxSupply
        );

        // Mint tokens
        let seeds = &[
            b"token_state".as_ref(),
            &[state.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.recipient_token_account.to_account_info(),
            authority: ctx.accounts.token_state.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

        token::mint_to(cpi_ctx, amount)?;

        state.total_minted += amount;

        msg!("Minted {} tokens to {}", amount, ctx.accounts.recipient.key());

        emit!(TokensMinted {
            recipient: ctx.accounts.recipient.key(),
            amount,
            total_minted: state.total_minted,
        });

        Ok(())
    }

    /// Transfer tokens with daily limit check
    pub fn transfer_with_limit(ctx: Context<TransferWithLimit>, amount: u64) -> Result<()> {
        let state = &ctx.accounts.token_state;
        let user_state = &mut ctx.accounts.user_transfer_state;
        let clock = Clock::get()?;

        require!(!state.is_frozen, TokenError::TokenFrozen);

        // Check if new day - reset counter
        let current_day = clock.unix_timestamp / 86400;
        if user_state.last_transfer_day != current_day {
            user_state.daily_transferred = 0;
            user_state.last_transfer_day = current_day;
        }

        // Check daily limit
        require!(
            user_state.daily_transferred + amount <= state.daily_limit,
            TokenError::DailyLimitExceeded
        );

        // Perform transfer
        let cpi_accounts = Transfer {
            from: ctx.accounts.from_token_account.to_account_info(),
            to: ctx.accounts.to_token_account.to_account_info(),
            authority: ctx.accounts.from.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        token::transfer(cpi_ctx, amount)?;

        // Update daily counter
        user_state.daily_transferred += amount;

        msg!("Transferred {} tokens", amount);
        msg!("Daily total: {}/{}", user_state.daily_transferred, state.daily_limit);

        emit!(TokensTransferred {
            from: ctx.accounts.from.key(),
            to: ctx.accounts.to.key(),
            amount,
            daily_total: user_state.daily_transferred,
        });

        Ok(())
    }

    /// Burn tokens
    pub fn burn_tokens(ctx: Context<BurnTokens>, amount: u64) -> Result<()> {
        let state = &mut ctx.accounts.token_state;

        let cpi_accounts = Burn {
            mint: ctx.accounts.mint.to_account_info(),
            from: ctx.accounts.from_token_account.to_account_info(),
            authority: ctx.accounts.owner.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        token::burn(cpi_ctx, amount)?;

        state.total_minted -= amount;

        msg!("Burned {} tokens", amount);

        emit!(TokensBurned {
            owner: ctx.accounts.owner.key(),
            amount,
            total_supply: state.total_minted,
        });

        Ok(())
    }

    /// Freeze all transfers (emergency - admin only)
    pub fn freeze(ctx: Context<AdminAction>) -> Result<()> {
        let state = &mut ctx.accounts.token_state;
        state.is_frozen = true;

        msg!("Token transfers FROZEN by admin");

        emit!(TokenFrozen {
            frozen_by: ctx.accounts.authority.key(),
        });

        Ok(())
    }

    /// Unfreeze transfers (admin only)
    pub fn unfreeze(ctx: Context<AdminAction>) -> Result<()> {
        let state = &mut ctx.accounts.token_state;
        state.is_frozen = false;

        msg!("Token transfers UNFROZEN by admin");

        emit!(TokenUnfrozen {
            unfrozen_by: ctx.accounts.authority.key(),
        });

        Ok(())
    }

    /// Update daily transfer limit (admin only)
    pub fn update_daily_limit(ctx: Context<AdminAction>, new_limit: u64) -> Result<()> {
        let state = &mut ctx.accounts.token_state;
        let old_limit = state.daily_limit;
        state.daily_limit = new_limit;

        msg!("Daily limit updated: {} -> {}", old_limit, new_limit);

        emit!(DailyLimitUpdated {
            old_limit,
            new_limit,
            updated_by: ctx.accounts.authority.key(),
        });

        Ok(())
    }
}

// ============================================================================
// ACCOUNTS
// ============================================================================

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + TokenState::INIT_SPACE,
        seeds = [b"token_state"],
        bump
    )]
    pub token_state: Account<'info, TokenState>,

    #[account(
        init,
        payer = authority,
        mint::decimals = DECIMALS,
        mint::authority = token_state,
    )]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(
        mut,
        seeds = [b"token_state"],
        bump = token_state.bump,
        constraint = token_state.authority == authority.key() @ TokenError::NotAuthority
    )]
    pub token_state: Account<'info, TokenState>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub recipient_token_account: Account<'info, TokenAccount>,

    /// CHECK: Recipient of minted tokens
    pub recipient: UncheckedAccount<'info>,

    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct TransferWithLimit<'info> {
    #[account(
        seeds = [b"token_state"],
        bump = token_state.bump
    )]
    pub token_state: Account<'info, TokenState>,

    #[account(
        init_if_needed,
        payer = from,
        space = 8 + UserTransferState::INIT_SPACE,
        seeds = [b"user_transfer", from.key().as_ref()],
        bump
    )]
    pub user_transfer_state: Account<'info, UserTransferState>,

    #[account(mut)]
    pub from_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub to_token_account: Account<'info, TokenAccount>,

    /// CHECK: Recipient
    pub to: UncheckedAccount<'info>,

    #[account(mut)]
    pub from: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BurnTokens<'info> {
    #[account(
        mut,
        seeds = [b"token_state"],
        bump = token_state.bump
    )]
    pub token_state: Account<'info, TokenState>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub from_token_account: Account<'info, TokenAccount>,

    pub owner: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct AdminAction<'info> {
    #[account(
        mut,
        seeds = [b"token_state"],
        bump = token_state.bump,
        constraint = token_state.authority == authority.key() @ TokenError::NotAuthority
    )]
    pub token_state: Account<'info, TokenState>,

    pub authority: Signer<'info>,
}

// ============================================================================
// STATE
// ============================================================================

#[account]
#[derive(InitSpace)]
pub struct TokenState {
    pub authority: Pubkey,
    pub mint: Pubkey,
    #[max_len(32)]
    pub name: String,
    #[max_len(8)]
    pub symbol: String,
    pub max_supply: u64,
    pub total_minted: u64,
    pub is_frozen: bool,
    pub daily_limit: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct UserTransferState {
    pub user: Pubkey,
    pub daily_transferred: u64,
    pub last_transfer_day: i64,
    pub bump: u8,
}

// ============================================================================
// EVENTS
// ============================================================================

#[event]
pub struct TokensMinted {
    pub recipient: Pubkey,
    pub amount: u64,
    pub total_minted: u64,
}

#[event]
pub struct TokensTransferred {
    pub from: Pubkey,
    pub to: Pubkey,
    pub amount: u64,
    pub daily_total: u64,
}

#[event]
pub struct TokensBurned {
    pub owner: Pubkey,
    pub amount: u64,
    pub total_supply: u64,
}

#[event]
pub struct TokenFrozen {
    pub frozen_by: Pubkey,
}

#[event]
pub struct TokenUnfrozen {
    pub unfrozen_by: Pubkey,
}

#[event]
pub struct DailyLimitUpdated {
    pub old_limit: u64,
    pub new_limit: u64,
    pub updated_by: Pubkey,
}

// ============================================================================
// ERRORS
// ============================================================================

#[error_code]
pub enum TokenError {
    #[msg("Token transfers are frozen")]
    TokenFrozen,
    #[msg("Exceeds maximum supply")]
    ExceedsMaxSupply,
    #[msg("Daily transfer limit exceeded (20 EUR max)")]
    DailyLimitExceeded,
    #[msg("Not authorized as token authority")]
    NotAuthority,
    #[msg("Invalid amount")]
    InvalidAmount,
}
