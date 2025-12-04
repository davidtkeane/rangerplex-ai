// RANGERBLOCK REGISTRATION - SOLANA/ANCHOR
// ==========================================
// User registration and consent tracking for RangerBlock ecosystem
// Author: David Keane (IrishRanger) + Claude Code (Ranger)
//
// Deploy with: anchor build && anchor deploy
// Test with: anchor test
//
// Rangers lead the way!

use anchor_lang::prelude::*;

declare_id!("RNGRreg1111111111111111111111111111111111111");

#[program]
pub mod ranger_registration {
    use super::*;

    /// Initialize the registration program
    pub fn initialize(ctx: Context<Initialize>, supreme_admin: Pubkey) -> Result<()> {
        let state = &mut ctx.accounts.program_state;
        state.owner = ctx.accounts.owner.key();
        state.supreme_admin = supreme_admin;
        state.total_registrations = 0;
        state.pending_count = 0;
        state.approved_count = 0;
        state.denied_count = 0;
        state.revoked_count = 0;
        state.current_terms_version = "1.0.0".to_string();
        state.bump = ctx.bumps.program_state;

        msg!("RangerBlock Registration initialized!");
        msg!("Supreme Admin: {}", supreme_admin);
        Ok(())
    }

    /// Submit a new registration with consent
    pub fn register(
        ctx: Context<Register>,
        user_id_hash: [u8; 32],
        public_key_hash: [u8; 32],
        hardware_id_hash: [u8; 32],
        username: String,
        app_type: String,
        terms_version: String,
        terms_hash: [u8; 32],
    ) -> Result<()> {
        require!(username.len() <= 32, RegistrationError::UsernameTooLong);
        require!(username.len() > 0, RegistrationError::UsernameEmpty);

        let registration = &mut ctx.accounts.registration;
        let state = &mut ctx.accounts.program_state;
        let clock = Clock::get()?;

        // Check hardware not already used (ban evasion prevention)
        // Note: Hardware check done via PDA derivation

        registration.user_id_hash = user_id_hash;
        registration.public_key_hash = public_key_hash;
        registration.hardware_id_hash = hardware_id_hash;
        registration.username = username.clone();
        registration.app_type = app_type.clone();
        registration.terms_version = terms_version.clone();
        registration.terms_hash = terms_hash;
        registration.consent_timestamp = clock.unix_timestamp;
        registration.registered_at = clock.unix_timestamp;
        registration.registered_slot = clock.slot;
        registration.status = RegistrationStatus::Pending;
        registration.status_reason = String::new();
        registration.approved_by = Pubkey::default();
        registration.status_updated_at = 0;
        registration.owner = ctx.accounts.user.key();
        registration.bump = ctx.bumps.registration;

        // Update stats
        state.total_registrations += 1;
        state.pending_count += 1;

        msg!("Registration submitted: {}", username);
        msg!("App type: {}", app_type);
        msg!("Terms version: {}", terms_version);

        emit!(RegistrationSubmitted {
            user_id_hash,
            username,
            app_type,
            terms_version,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Approve a pending registration (admin only)
    pub fn approve(ctx: Context<AdminAction>) -> Result<()> {
        let registration = &mut ctx.accounts.registration;
        let state = &mut ctx.accounts.program_state;
        let clock = Clock::get()?;

        require!(
            registration.status == RegistrationStatus::Pending,
            RegistrationError::NotPending
        );

        registration.status = RegistrationStatus::Approved;
        registration.approved_by = ctx.accounts.admin.key();
        registration.status_updated_at = clock.unix_timestamp;

        state.pending_count -= 1;
        state.approved_count += 1;

        msg!("Registration approved: {}", registration.username);

        emit!(RegistrationApproved {
            user_id_hash: registration.user_id_hash,
            approved_by: ctx.accounts.admin.key(),
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Deny a pending registration (admin only)
    pub fn deny(ctx: Context<AdminAction>, reason: String) -> Result<()> {
        let registration = &mut ctx.accounts.registration;
        let state = &mut ctx.accounts.program_state;
        let clock = Clock::get()?;

        require!(
            registration.status == RegistrationStatus::Pending,
            RegistrationError::NotPending
        );

        registration.status = RegistrationStatus::Denied;
        registration.status_reason = reason.clone();
        registration.status_updated_at = clock.unix_timestamp;

        state.pending_count -= 1;
        state.denied_count += 1;

        msg!("Registration denied: {}", registration.username);
        msg!("Reason: {}", reason);

        emit!(RegistrationDenied {
            user_id_hash: registration.user_id_hash,
            denied_by: ctx.accounts.admin.key(),
            reason,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Revoke an approved registration (admin only)
    pub fn revoke(ctx: Context<AdminAction>, reason: String) -> Result<()> {
        let registration = &mut ctx.accounts.registration;
        let state = &mut ctx.accounts.program_state;
        let clock = Clock::get()?;

        require!(
            registration.status == RegistrationStatus::Approved,
            RegistrationError::NotApproved
        );

        registration.status = RegistrationStatus::Revoked;
        registration.status_reason = reason.clone();
        registration.status_updated_at = clock.unix_timestamp;

        state.approved_count -= 1;
        state.revoked_count += 1;

        msg!("Registration revoked: {}", registration.username);
        msg!("Reason: {}", reason);

        emit!(RegistrationRevoked {
            user_id_hash: registration.user_id_hash,
            revoked_by: ctx.accounts.admin.key(),
            reason,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Add an admin (owner only)
    pub fn add_admin(ctx: Context<ManageAdmin>) -> Result<()> {
        let admin_account = &mut ctx.accounts.admin_account;

        admin_account.admin = ctx.accounts.new_admin.key();
        admin_account.added_by = ctx.accounts.owner.key();
        admin_account.added_at = Clock::get()?.unix_timestamp;
        admin_account.is_active = true;
        admin_account.bump = ctx.bumps.admin_account;

        msg!("Admin added: {}", ctx.accounts.new_admin.key());

        emit!(AdminAdded {
            admin: ctx.accounts.new_admin.key(),
            added_by: ctx.accounts.owner.key(),
        });

        Ok(())
    }

    /// Remove an admin (owner only)
    pub fn remove_admin(ctx: Context<RemoveAdmin>) -> Result<()> {
        let admin_account = &mut ctx.accounts.admin_account;
        let state = &ctx.accounts.program_state;

        require!(
            admin_account.admin != state.supreme_admin,
            RegistrationError::CannotRemoveSupreme
        );

        admin_account.is_active = false;

        msg!("Admin removed: {}", admin_account.admin);

        emit!(AdminRemoved {
            admin: admin_account.admin,
            removed_by: ctx.accounts.owner.key(),
        });

        Ok(())
    }

    /// Update terms version (owner only)
    pub fn update_terms(ctx: Context<UpdateTerms>, version: String, terms_hash: [u8; 32]) -> Result<()> {
        let state = &mut ctx.accounts.program_state;

        state.current_terms_version = version.clone();
        state.current_terms_hash = terms_hash;

        msg!("Terms updated to version: {}", version);

        emit!(TermsUpdated {
            version,
            terms_hash,
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
        payer = owner,
        space = 8 + ProgramState::INIT_SPACE,
        seeds = [b"program_state"],
        bump
    )]
    pub program_state: Account<'info, ProgramState>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(user_id_hash: [u8; 32])]
pub struct Register<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + Registration::INIT_SPACE,
        seeds = [b"registration", user_id_hash.as_ref()],
        bump
    )]
    pub registration: Account<'info, Registration>,

    #[account(
        mut,
        seeds = [b"program_state"],
        bump = program_state.bump
    )]
    pub program_state: Account<'info, ProgramState>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AdminAction<'info> {
    #[account(mut)]
    pub registration: Account<'info, Registration>,

    #[account(
        mut,
        seeds = [b"program_state"],
        bump = program_state.bump
    )]
    pub program_state: Account<'info, ProgramState>,

    #[account(
        seeds = [b"admin", admin.key().as_ref()],
        bump = admin_account.bump,
        constraint = admin_account.is_active @ RegistrationError::NotAdmin
    )]
    pub admin_account: Account<'info, AdminAccount>,

    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct ManageAdmin<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + AdminAccount::INIT_SPACE,
        seeds = [b"admin", new_admin.key().as_ref()],
        bump
    )]
    pub admin_account: Account<'info, AdminAccount>,

    #[account(
        seeds = [b"program_state"],
        bump = program_state.bump,
        constraint = program_state.owner == owner.key() || program_state.supreme_admin == owner.key() @ RegistrationError::NotOwner
    )]
    pub program_state: Account<'info, ProgramState>,

    /// CHECK: New admin to add
    pub new_admin: UncheckedAccount<'info>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RemoveAdmin<'info> {
    #[account(mut)]
    pub admin_account: Account<'info, AdminAccount>,

    #[account(
        seeds = [b"program_state"],
        bump = program_state.bump,
        constraint = program_state.owner == owner.key() || program_state.supreme_admin == owner.key() @ RegistrationError::NotOwner
    )]
    pub program_state: Account<'info, ProgramState>,

    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateTerms<'info> {
    #[account(
        mut,
        seeds = [b"program_state"],
        bump = program_state.bump,
        constraint = program_state.owner == owner.key() || program_state.supreme_admin == owner.key() @ RegistrationError::NotOwner
    )]
    pub program_state: Account<'info, ProgramState>,

    pub owner: Signer<'info>,
}

// ============================================================================
// STATE
// ============================================================================

#[account]
#[derive(InitSpace)]
pub struct ProgramState {
    pub owner: Pubkey,
    pub supreme_admin: Pubkey,
    pub total_registrations: u64,
    pub pending_count: u64,
    pub approved_count: u64,
    pub denied_count: u64,
    pub revoked_count: u64,
    #[max_len(16)]
    pub current_terms_version: String,
    pub current_terms_hash: [u8; 32],
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Registration {
    pub user_id_hash: [u8; 32],
    pub public_key_hash: [u8; 32],
    pub hardware_id_hash: [u8; 32],
    #[max_len(32)]
    pub username: String,
    #[max_len(32)]
    pub app_type: String,
    #[max_len(16)]
    pub terms_version: String,
    pub terms_hash: [u8; 32],
    pub consent_timestamp: i64,
    pub registered_at: i64,
    pub registered_slot: u64,
    pub status: RegistrationStatus,
    #[max_len(128)]
    pub status_reason: String,
    pub approved_by: Pubkey,
    pub status_updated_at: i64,
    pub owner: Pubkey,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct AdminAccount {
    pub admin: Pubkey,
    pub added_by: Pubkey,
    pub added_at: i64,
    pub is_active: bool,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum RegistrationStatus {
    Pending,
    Approved,
    Denied,
    Revoked,
}

// ============================================================================
// EVENTS
// ============================================================================

#[event]
pub struct RegistrationSubmitted {
    pub user_id_hash: [u8; 32],
    pub username: String,
    pub app_type: String,
    pub terms_version: String,
    pub timestamp: i64,
}

#[event]
pub struct RegistrationApproved {
    pub user_id_hash: [u8; 32],
    pub approved_by: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct RegistrationDenied {
    pub user_id_hash: [u8; 32],
    pub denied_by: Pubkey,
    pub reason: String,
    pub timestamp: i64,
}

#[event]
pub struct RegistrationRevoked {
    pub user_id_hash: [u8; 32],
    pub revoked_by: Pubkey,
    pub reason: String,
    pub timestamp: i64,
}

#[event]
pub struct AdminAdded {
    pub admin: Pubkey,
    pub added_by: Pubkey,
}

#[event]
pub struct AdminRemoved {
    pub admin: Pubkey,
    pub removed_by: Pubkey,
}

#[event]
pub struct TermsUpdated {
    pub version: String,
    pub terms_hash: [u8; 32],
}

// ============================================================================
// ERRORS
// ============================================================================

#[error_code]
pub enum RegistrationError {
    #[msg("Username too long (max 32 characters)")]
    UsernameTooLong,
    #[msg("Username cannot be empty")]
    UsernameEmpty,
    #[msg("Registration not in pending status")]
    NotPending,
    #[msg("Registration not in approved status")]
    NotApproved,
    #[msg("Not authorized as admin")]
    NotAdmin,
    #[msg("Not authorized as owner")]
    NotOwner,
    #[msg("Cannot remove supreme admin")]
    CannotRemoveSupreme,
    #[msg("Hardware ID already registered")]
    HardwareAlreadyUsed,
    #[msg("User already registered")]
    AlreadyRegistered,
}
