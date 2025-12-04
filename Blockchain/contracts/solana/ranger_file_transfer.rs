// RANGERBLOCK FILE TRANSFER - SOLANA/ANCHOR
// ==========================================
// Smart contract for formal file transfer agreements
// Author: David Keane (IrishRanger) + Claude Code (Ranger)
//
// Use Cases:
// - Legal file transfers with proof
// - Sending sensitive documents
// - .rangerblock file verification
// - Chain of custody for files
//
// Flow:
// 1. Sender creates transfer request with file hash
// 2. Receiver accepts or rejects
// 3. Both parties sign the contract
// 4. Immutable record created on blockchain
//
// Rangers lead the way!

use anchor_lang::prelude::*;

declare_id!("RNGRfile111111111111111111111111111111111111");

#[program]
pub mod ranger_file_transfer {
    use super::*;

    /// Initialize the file transfer program
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let state = &mut ctx.accounts.program_state;
        state.owner = ctx.accounts.owner.key();
        state.total_transfers = 0;
        state.completed_transfers = 0;
        state.total_bytes_transferred = 0;
        state.default_expiry = 86400; // 24 hours in seconds
        state.bump = ctx.bumps.program_state;

        msg!("RangerBlock File Transfer initialized!");
        Ok(())
    }

    /// Create a new file transfer request
    pub fn request_transfer(
        ctx: Context<RequestTransfer>,
        receiver_id_hash: [u8; 32],
        file_hash: [u8; 32],
        file_name: String,
        file_size: u64,
        file_type: String,
        message: String,
        sender_signature: [u8; 64],
    ) -> Result<()> {
        require!(file_name.len() <= 128, FileTransferError::FileNameTooLong);
        require!(file_size > 0, FileTransferError::InvalidFileSize);

        let transfer = &mut ctx.accounts.transfer;
        let state = &mut ctx.accounts.program_state;
        let clock = Clock::get()?;

        transfer.sender_id_hash = ctx.accounts.sender_id_hash.key().to_bytes();
        transfer.receiver_id_hash = receiver_id_hash;
        transfer.file_hash = file_hash;
        transfer.file_name = file_name.clone();
        transfer.file_size = file_size;
        transfer.file_type = file_type;
        transfer.message = message;
        transfer.created_at = clock.unix_timestamp;
        transfer.expires_at = clock.unix_timestamp + state.default_expiry as i64;
        transfer.accepted_at = 0;
        transfer.completed_at = 0;
        transfer.status = TransferStatus::Pending;
        transfer.sender_signature = sender_signature;
        transfer.receiver_signature = [0u8; 64];
        transfer.rangerblock_hash = [0u8; 32];
        transfer.sender = ctx.accounts.sender.key();
        transfer.bump = ctx.bumps.transfer;

        state.total_transfers += 1;

        msg!("Transfer requested: {} ({} bytes)", file_name, file_size);
        msg!("Expires at: {}", transfer.expires_at);

        emit!(TransferRequested {
            transfer_id: transfer.key(),
            sender_id_hash: transfer.sender_id_hash,
            receiver_id_hash,
            file_hash,
            file_name,
            file_size,
            expires_at: transfer.expires_at,
        });

        Ok(())
    }

    /// Accept a pending transfer
    pub fn accept_transfer(
        ctx: Context<AcceptTransfer>,
        receiver_signature: [u8; 64],
    ) -> Result<()> {
        let transfer = &mut ctx.accounts.transfer;
        let clock = Clock::get()?;

        require!(
            transfer.status == TransferStatus::Pending,
            FileTransferError::NotPending
        );
        require!(
            clock.unix_timestamp < transfer.expires_at,
            FileTransferError::TransferExpired
        );

        transfer.status = TransferStatus::Accepted;
        transfer.accepted_at = clock.unix_timestamp;
        transfer.receiver_signature = receiver_signature;

        msg!("Transfer accepted: {}", transfer.file_name);

        emit!(TransferAccepted {
            transfer_id: transfer.key(),
            receiver_id_hash: transfer.receiver_id_hash,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Reject a pending transfer
    pub fn reject_transfer(ctx: Context<RejectTransfer>, reason: String) -> Result<()> {
        let transfer = &mut ctx.accounts.transfer;
        let clock = Clock::get()?;

        require!(
            transfer.status == TransferStatus::Pending,
            FileTransferError::NotPending
        );

        transfer.status = TransferStatus::Rejected;

        msg!("Transfer rejected: {}", reason);

        emit!(TransferRejected {
            transfer_id: transfer.key(),
            receiver_id_hash: transfer.receiver_id_hash,
            reason,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Mark transfer as completed (after file received and verified)
    pub fn complete_transfer(
        ctx: Context<CompleteTransfer>,
        rangerblock_hash: [u8; 32],
    ) -> Result<()> {
        let transfer = &mut ctx.accounts.transfer;
        let state = &mut ctx.accounts.program_state;
        let clock = Clock::get()?;

        require!(
            transfer.status == TransferStatus::Accepted,
            FileTransferError::NotAccepted
        );

        transfer.status = TransferStatus::Completed;
        transfer.completed_at = clock.unix_timestamp;
        transfer.rangerblock_hash = rangerblock_hash;

        state.completed_transfers += 1;
        state.total_bytes_transferred += transfer.file_size;

        msg!("Transfer completed: {}", transfer.file_name);
        msg!("File hash: {:?}", transfer.file_hash);
        msg!("Rangerblock hash: {:?}", rangerblock_hash);

        emit!(TransferCompleted {
            transfer_id: transfer.key(),
            file_hash: transfer.file_hash,
            rangerblock_hash,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Cancel a pending transfer (sender only)
    pub fn cancel_transfer(ctx: Context<CancelTransfer>) -> Result<()> {
        let transfer = &mut ctx.accounts.transfer;
        let clock = Clock::get()?;

        require!(
            transfer.status == TransferStatus::Pending,
            FileTransferError::NotPending
        );
        require!(
            transfer.sender == ctx.accounts.sender.key(),
            FileTransferError::NotSender
        );

        transfer.status = TransferStatus::Cancelled;

        msg!("Transfer cancelled: {}", transfer.file_name);

        emit!(TransferCancelled {
            transfer_id: transfer.key(),
            sender_id_hash: transfer.sender_id_hash,
            timestamp: clock.unix_timestamp,
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
#[instruction(receiver_id_hash: [u8; 32], file_hash: [u8; 32])]
pub struct RequestTransfer<'info> {
    #[account(
        init,
        payer = sender,
        space = 8 + FileTransfer::INIT_SPACE,
        seeds = [b"transfer", sender.key().as_ref(), file_hash.as_ref()],
        bump
    )]
    pub transfer: Account<'info, FileTransfer>,

    #[account(
        mut,
        seeds = [b"program_state"],
        bump = program_state.bump
    )]
    pub program_state: Account<'info, ProgramState>,

    /// CHECK: Sender's identity hash account
    pub sender_id_hash: UncheckedAccount<'info>,

    #[account(mut)]
    pub sender: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AcceptTransfer<'info> {
    #[account(mut)]
    pub transfer: Account<'info, FileTransfer>,

    pub receiver: Signer<'info>,
}

#[derive(Accounts)]
pub struct RejectTransfer<'info> {
    #[account(mut)]
    pub transfer: Account<'info, FileTransfer>,

    pub receiver: Signer<'info>,
}

#[derive(Accounts)]
pub struct CompleteTransfer<'info> {
    #[account(mut)]
    pub transfer: Account<'info, FileTransfer>,

    #[account(
        mut,
        seeds = [b"program_state"],
        bump = program_state.bump
    )]
    pub program_state: Account<'info, ProgramState>,

    pub receiver: Signer<'info>,
}

#[derive(Accounts)]
pub struct CancelTransfer<'info> {
    #[account(mut)]
    pub transfer: Account<'info, FileTransfer>,

    pub sender: Signer<'info>,
}

// ============================================================================
// STATE
// ============================================================================

#[account]
#[derive(InitSpace)]
pub struct ProgramState {
    pub owner: Pubkey,
    pub total_transfers: u64,
    pub completed_transfers: u64,
    pub total_bytes_transferred: u64,
    pub default_expiry: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct FileTransfer {
    pub sender_id_hash: [u8; 32],
    pub receiver_id_hash: [u8; 32],
    pub file_hash: [u8; 32],
    pub rangerblock_hash: [u8; 32],
    #[max_len(128)]
    pub file_name: String,
    pub file_size: u64,
    #[max_len(32)]
    pub file_type: String,
    #[max_len(256)]
    pub message: String,
    pub created_at: i64,
    pub expires_at: i64,
    pub accepted_at: i64,
    pub completed_at: i64,
    pub status: TransferStatus,
    pub sender_signature: [u8; 64],
    pub receiver_signature: [u8; 64],
    pub sender: Pubkey,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum TransferStatus {
    Pending,
    Accepted,
    Rejected,
    Completed,
    Cancelled,
    Expired,
}

// ============================================================================
// EVENTS
// ============================================================================

#[event]
pub struct TransferRequested {
    pub transfer_id: Pubkey,
    pub sender_id_hash: [u8; 32],
    pub receiver_id_hash: [u8; 32],
    pub file_hash: [u8; 32],
    pub file_name: String,
    pub file_size: u64,
    pub expires_at: i64,
}

#[event]
pub struct TransferAccepted {
    pub transfer_id: Pubkey,
    pub receiver_id_hash: [u8; 32],
    pub timestamp: i64,
}

#[event]
pub struct TransferRejected {
    pub transfer_id: Pubkey,
    pub receiver_id_hash: [u8; 32],
    pub reason: String,
    pub timestamp: i64,
}

#[event]
pub struct TransferCompleted {
    pub transfer_id: Pubkey,
    pub file_hash: [u8; 32],
    pub rangerblock_hash: [u8; 32],
    pub timestamp: i64,
}

#[event]
pub struct TransferCancelled {
    pub transfer_id: Pubkey,
    pub sender_id_hash: [u8; 32],
    pub timestamp: i64,
}

// ============================================================================
// ERRORS
// ============================================================================

#[error_code]
pub enum FileTransferError {
    #[msg("File name too long (max 128 chars)")]
    FileNameTooLong,
    #[msg("Invalid file size")]
    InvalidFileSize,
    #[msg("Transfer not in pending status")]
    NotPending,
    #[msg("Transfer not in accepted status")]
    NotAccepted,
    #[msg("Transfer has expired")]
    TransferExpired,
    #[msg("Not the sender of this transfer")]
    NotSender,
    #[msg("Not the receiver of this transfer")]
    NotReceiver,
    #[msg("Transfer not found")]
    TransferNotFound,
}
