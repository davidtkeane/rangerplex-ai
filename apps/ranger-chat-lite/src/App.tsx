import { useState, useEffect, useRef } from 'react'
import ScreensaverBackground from './components/ScreensaverBackground'
import './App.css'
import RadioPlayer, { RadioSettings } from './components/RadioPlayer'

// Electron API type declaration
declare global {
    interface Window {
        electronAPI?: {
            identity: {
                has: () => Promise<boolean>
                load: () => Promise<any>
                getOrCreate: (username?: string) => Promise<any>
                generateUsername: () => Promise<string>
                updateUsername: (newUsername: string) => Promise<any>
                recordMessage: () => Promise<void>
                getPaths: () => Promise<{ storageDir: string; personalDir: string; identityFile: string }>
                export: () => Promise<string | null>
                reset: () => Promise<void>
            }
            ledger: {
                init: () => Promise<boolean>
                getStatus: () => Promise<LedgerStatus>
                addMessage: (msg: { sender: string; senderName: string; content: string; channel: string }) => Promise<any>
                getBlocks: (page?: number, limit?: number) => Promise<LedgerBlock[]>
                getBlock: (index: number) => Promise<LedgerBlock | null>
                mineBlock: (validatorId?: string) => Promise<LedgerBlock | null>
                exportChain: () => Promise<any>
                getBalance: (userId: string) => Promise<{ balance: number; transactions: string[] }>
            }
            admin: {
                getStatus: () => Promise<AdminStatus>
                checkUserId: (userId: string) => Promise<AdminStatus>
                getRegistryPath: () => Promise<string>
            }
            app: {
                runUpdate: () => Promise<{
                    success: boolean
                    gitPull: { success: boolean; output: string; error: string }
                    npmInstall: { success: boolean; output: string; error: string }
                    isPackaged?: boolean
                }>
                reload: () => Promise<boolean>
                checkForUpdates: () => Promise<{ updateAvailable: boolean; latestVersion: string | null }>
                getVersion: () => Promise<string>
            }
        }
    }
}

// Admin status type
interface AdminStatus {
    isAdmin: boolean
    isSupreme: boolean
    isModerator: boolean
    role: string
    adminUsername?: string
}

// Ledger types
interface LedgerStatus {
    version: string
    chainHeight: number
    lastBlockHash: string
    pendingTransactions: number
    totalTransactions: number
    totalMessages: number
    totalUsers: number
    lastBlockTime: number | null
}

interface LedgerBlock {
    index: number
    hash: string
    previousHash: string
    timestamp: number
    merkleRoot: string
    nonce: number
    transactionCount: number
    transactions: LedgerTransaction[]
    validator: { nodeId: string; timestamp: number } | null
}

interface LedgerTransaction {
    txId: string
    type: string
    sender: string
    timestamp: number
    data: any
    hash: string
    pending?: boolean
    blockIndex?: number
    blockHash?: string
}

// Types
interface Message {
    type: 'chat' | 'system'
    sender: string
    senderId?: string  // For tracking real identity
    content: string
    timestamp: string
}

interface UserIdentity {
    userId: string
    nodeId: string
    username: string
    created: string
    lastSeen: string
    hardwareFingerprint: string
    platform: {
        system: string
        machine: string
        hostname: string
    }
    version: string
    appType: string
}

// Blockchain transaction type
interface BlockchainTx {
    id: string
    type: 'send' | 'receive' | 'system' | 'peer'
    direction: 'in' | 'out'
    from: string
    to: string
    payload: string
    size: number
    timestamp: number
    status: 'pending' | 'confirmed' | 'broadcast'
}

// Voice call states
type CallState = 'idle' | 'calling' | 'ringing' | 'in_call'

// Video call types (Phase 1 - Video Call Foundation)
type CallType = 'voice' | 'video'
type TransportMode = 'webrtc' | 'blockchain' | 'hybrid'

// Video quality presets
type VideoQuality = 'low' | 'medium' | 'high' | 'hd'

// Video settings interface
interface VideoSettings {
    quality: VideoQuality
    maxBandwidth: number // kbps
    frameRate: 15 | 24 | 30
    autoQuality: boolean
    lowBandwidthMode: boolean
    mirrorLocal: boolean
    muteVideoOnJoin: boolean
    muteAudioOnJoin: boolean
    transportMode: TransportMode
    noiseSupression: boolean
    echoCancellation: boolean
    backgroundBlur: 'off' | 'light' | 'heavy'
    hardwareAcceleration: boolean
    highContrastControls: boolean
    largeControlButtons: boolean
    screenReaderAnnouncements: boolean
    keyboardShortcuts: boolean
}

// Default video settings
const DEFAULT_VIDEO_SETTINGS: VideoSettings = {
    quality: 'medium',
    maxBandwidth: 1024,
    frameRate: 15,
    autoQuality: true,
    lowBandwidthMode: false,
    mirrorLocal: true,
    muteVideoOnJoin: false,
    muteAudioOnJoin: false,
    transportMode: 'hybrid',
    noiseSupression: true,
    echoCancellation: true,
    backgroundBlur: 'off',
    hardwareAcceleration: true,
    highContrastControls: false,
    largeControlButtons: false,
    screenReaderAnnouncements: true,
    keyboardShortcuts: true
}

// Video quality presets mapping (used in Phase 3 - startVideoCapture)
const _VIDEO_QUALITY_PRESETS: Record<VideoQuality, { width: number; height: number; bitrate: number }> = {
    low: { width: 320, height: 240, bitrate: 256 },
    medium: { width: 640, height: 480, bitrate: 512 },
    high: { width: 1280, height: 720, bitrate: 1024 },
    hd: { width: 1920, height: 1080, bitrate: 2048 }
}

// WebRTC Configuration (Phase 4 - WebRTC Connection)
const RTC_CONFIG: RTCConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
    ]
}

// Peer info
interface PeerInfo {
    address: string
    userId?: string
    nickname: string
    mode?: string
    capabilities?: string[]
}

// Smart Contract type
interface SmartContract {
    id: string
    name: string
    description: string
    chain: 'ethereum' | 'solana' | 'both'
    category: 'registration' | 'bridge' | 'transfer' | 'token'
    icon: string
    status: 'available' | 'deployed' | 'selected'
    features: string[]
    contractAddress?: string
}

interface WeatherLocation {
    lat: number
    lon: number
    label: string
    source: 'ip' | 'gps' | 'manual'
    updatedAt: number
}

// Available Smart Contracts
const SMART_CONTRACTS: SmartContract[] = [
    {
        id: 'ranger-registration',
        name: 'RangerRegistration',
        description: 'User registration with consent tracking and hardware ID verification',
        chain: 'both',
        category: 'registration',
        icon: '📋',
        status: 'available',
        features: ['User registration', 'Consent bundled', 'Hardware ID tracking', 'Admin approve/deny', 'Ban evasion prevention']
    },
    {
        id: 'ranger-bridge',
        name: 'RangerBridge',
        description: 'Cross-chain conversion between RangerCoin and major cryptocurrencies',
        chain: 'both',
        category: 'bridge',
        icon: '🌉',
        status: 'available',
        features: ['BTC conversion (WBTC)', 'ETH conversion', 'SOL conversion', 'USDC stablecoin', '20 EUR/day limit', '1% fee']
    },
    {
        id: 'ranger-file-transfer',
        name: 'RangerFileTransfer',
        description: 'Formal file transfer agreements with blockchain verification',
        chain: 'both',
        category: 'transfer',
        icon: '📁',
        status: 'available',
        features: ['Legal transfers', 'Chain of custody', '.rangerblock format', 'Dual signatures', '24h expiry', 'Hash verification']
    },
    {
        id: 'ranger-token',
        name: 'RangerToken',
        description: 'SPL Token with daily transfer limits for Solana',
        chain: 'solana',
        category: 'token',
        icon: '🪙',
        status: 'available',
        features: ['SPL Token standard', '20 EUR/day limit', 'Admin freeze', 'Mint/burn controls', 'Treasury management']
    },
    // === COMING SOON: SECURE COMMUNICATION CONTRACTS ===
    {
        id: 'ranger-text-chat',
        name: 'RangerTextChat',
        description: 'COMING SOON: Secure text messaging with 99.99% identity verification',
        chain: 'both',
        category: 'communication' as any,
        icon: '💬',
        status: 'available',
        features: ['Identity verification', 'E2E encryption', 'Session keys', 'Challenge-response auth', 'Block/report system', 'WHISPER PROTOCOL']
    },
    {
        id: 'ranger-voice-chat',
        name: 'RangerVoiceChat',
        description: 'COMING SOON: Secure voice calls with blockchain identity verification',
        chain: 'both',
        category: 'communication' as any,
        icon: '🎙️',
        status: 'available',
        features: ['Pre-call ID verification', 'DTLS/SRTP encryption', 'Call duration logging', 'Missed call tracking', 'DND status', 'ECHO PROTOCOL']
    },
    {
        id: 'ranger-video-chat',
        name: 'RangerVideoChat',
        description: 'COMING SOON: Secure video calls with verified identity before answering',
        chain: 'both',
        category: 'communication' as any,
        icon: '📹',
        status: 'available',
        features: ['Face-to-identity confirmation', 'WebRTC encryption', 'Screen share flag', 'Recording consent', 'Quality negotiation', 'VISION PROTOCOL']
    }
]

// Theme definitions
type ThemeName = 'classic' | 'matrix' | 'tron' | 'retro'

const THEMES: Record<ThemeName, { name: string; icon: string }> = {
    classic: { name: 'Classic', icon: '💬' },
    matrix: { name: 'Matrix', icon: '🟢' },
    tron: { name: 'Tron', icon: '🔵' },
    retro: { name: 'Retro', icon: '💾' }
}

// Emoji categories
const EMOJI_DATA = {
    frequent: ['😀', '😂', '🤣', '😊', '😍', '🥰', '😎', '🤔', '👍', '👎', '👏', '🙌', '🔥', '❤️', '💯', '🎉', '✨', '🚀', '💪', '🙏'],
    smileys: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😋', '😛', '😜', '🤪', '😝', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '😮', '🤯', '😱', '😨', '😰', '😥'],
    gestures: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '💪', '🦾'],
    hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️'],
    animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🦅', '🦆', '🦉', '🐺', '🦈'],
    food: ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍕', '🍔', '🍟', '🌭', '🍿', '🧁', '🍩', '🍪', '☕', '🍺', '🍷', '🥤', '🧃'],
    activities: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🎮', '🎲', '🎯', '🎪', '🎨', '🎬', '🎤', '🎧', '🎸', '🎹', '🎺', '🥁', '🏆', '🥇'],
    travel: ['🚗', '🚕', '🚌', '🚎', '🏎️', '🚓', '🚑', '✈️', '🚀', '🛸', '🚁', '⛵', '🚢', '🏠', '🏰', '🗼', '🗽', '⛰️', '🏝️', '🌋'],
    symbols: ['💯', '🔥', '⭐', '✨', '💫', '🌟', '⚡', '💥', '💢', '💤', '💬', '💭', '🗯️', '♠️', '♣️', '♥️', '♦️', '🎵', '🎶', '➕']
}

// App views
type ViewType = 'login' | 'chat' | 'settings' | 'ledger'

// Current app version
const APP_VERSION = '1.9.6'
const GITHUB_REPO = 'davidtkeane/rangerplex-ai'
const WEATHER_CODE_LABELS: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail'
}
const WEATHER_LOCATION_STORAGE_KEY = 'rangerChatWeatherLocation'
const RAIN_ALERTS_ENABLED_KEY = 'rangerChatRainAlertsEnabled'
const RAIN_ALERT_LOOKAHEAD_KEY = 'rangerChatRainAlertLookaheadHours'
const WEATHER_LOCATION_MAX_AGE_MS = 6 * 60 * 60 * 1000
const RAIN_ALERT_CHECK_INTERVAL_MS = 30 * 60 * 1000

function App() {
    // View state
    const [view, setView] = useState<ViewType>('login')
    const [connected, setConnected] = useState(false)
    const [loading, setLoading] = useState(true)

    // Identity state
    const [identity, setIdentity] = useState<UserIdentity | null>(null)
    const [username, setUsername] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)

    // Connection state
    const [serverUrl, setServerUrl] = useState('ws://44.222.101.125:5555')
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [_peerCount, setPeerCount] = useState(0)

    // UI state
    const [theme, setTheme] = useState<ThemeName>('classic')
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [emojiCategory, setEmojiCategory] = useState<keyof typeof EMOJI_DATA>('frequent')
    const [emojiSearch, setEmojiSearch] = useState('')
    const [showSearch, setShowSearch] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [showSlashHelp, setShowSlashHelp] = useState(false)

    // Settings state
    const [storagePaths, setStoragePaths] = useState<any>(null)
    const [_identityExport, setIdentityExport] = useState<string | null>(null)

    // Blockchain transaction log
    const [transactions, setTransactions] = useState<BlockchainTx[]>([])
    const [showTransactions, setShowTransactions] = useState(false)
    const [txStats, setTxStats] = useState({ sent: 0, received: 0, total: 0, bytes: 0 })

    // Smart contracts state
    const [contracts, setContracts] = useState<SmartContract[]>(SMART_CONTRACTS)
    const [selectedContract, setSelectedContract] = useState<SmartContract | null>(null)
    const [showContractDetails, setShowContractDetails] = useState(false)
    const [preferredChain, setPreferredChain] = useState<'ethereum' | 'solana'>('solana')

    // Update notification state
    const [updateAvailable, setUpdateAvailable] = useState(false)
    const [latestVersion, setLatestVersion] = useState<string | null>(null)
    const [showUpdateBanner, setShowUpdateBanner] = useState(true)
    const [updateNotificationsEnabled, setUpdateNotificationsEnabled] = useState(() => {
        const saved = localStorage.getItem('rangerChatUpdateNotifications')
        return saved !== null ? saved === 'true' : true // Default to enabled
    })
    const [isUpdating, setIsUpdating] = useState(false)
    const [updateStatus, setUpdateStatus] = useState<string>('')
    const [updateError, setUpdateError] = useState<string>('')

    // Login picture state ('default' = eagle emoji, 'rangersmyth' = rangersmyth-pic.png, or base64 custom image)
    const [loginPicture, setLoginPicture] = useState<string>(() => {
        return localStorage.getItem('rangerChatLoginPicture') || 'default'
    })
    const loginPictureInputRef = useRef<HTMLInputElement>(null)

    // Weather state
    const [weatherLocation, setWeatherLocation] = useState<WeatherLocation | null>(() => {
        const stored = localStorage.getItem(WEATHER_LOCATION_STORAGE_KEY)
        if (!stored) return null
        try {
            return JSON.parse(stored) as WeatherLocation
        } catch {
            return null
        }
    })
    const [weatherStatus, setWeatherStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
    const [weatherError, setWeatherError] = useState<string | null>(null)
    const [rainAlertsEnabled, setRainAlertsEnabled] = useState(() => {
        const stored = localStorage.getItem(RAIN_ALERTS_ENABLED_KEY)
        return stored ? stored === 'true' : true
    })
    const [rainAlertLookaheadHours, setRainAlertLookaheadHours] = useState(() => {
        const stored = localStorage.getItem(RAIN_ALERT_LOOKAHEAD_KEY)
        const parsed = stored ? parseInt(stored, 10) : 3
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 3
    })

    // Ledger state
    const [ledgerStatus, setLedgerStatus] = useState<LedgerStatus | null>(null)
    const [ledgerBlocks, setLedgerBlocks] = useState<LedgerBlock[]>([])
    const [selectedBlock, setSelectedBlock] = useState<LedgerBlock | null>(null)
    const [ledgerLoading, setLedgerLoading] = useState(false)

    // Admin state
    const [adminStatus, setAdminStatus] = useState<AdminStatus | null>(null)

    // Voice call state
    const [callState, setCallState] = useState<CallState>('idle')
    const [callPartner, setCallPartner] = useState<string | null>(null)
    const [incomingCaller, setIncomingCaller] = useState<string | null>(null)
    const [isTalking, setIsTalking] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [peers, setPeers] = useState<PeerInfo[]>([])
    const [showPeerList, setShowPeerList] = useState(false)
    const [audioLevel, setAudioLevel] = useState(0)

    // Audio device state
    const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])
    const [selectedMicId, setSelectedMicId] = useState<string>('default')
    const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDeviceInfo[]>([])
    const [selectedSpeakerId, setSelectedSpeakerId] = useState<string>('default')

    // ============================================
    // VIDEO CALL STATE (Phase 1 - Foundation)
    // ============================================

    // Call type: voice or video
    const [callType, setCallType] = useState<CallType>('voice')

    // Video streams
    const [localVideoStream, setLocalVideoStream] = useState<MediaStream | null>(null)
    const [remoteVideoStream, setRemoteVideoStream] = useState<MediaStream | null>(null)

    // Camera state  
    const [isCameraOn, setIsCameraOn] = useState(true)
    const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])
    const [selectedCameraId, setSelectedCameraId] = useState<string>('default')

    // Video settings (persisted to localStorage)
    const [videoSettings, setVideoSettings] = useState<VideoSettings>(() => {
        const saved = localStorage.getItem('rangerChatVideoSettings')
        if (saved) {
            try {
                return { ...DEFAULT_VIDEO_SETTINGS, ...JSON.parse(saved) }
            } catch { }
        }
        return DEFAULT_VIDEO_SETTINGS
    })

    // Connection quality indicator (0-100)
    const [connectionQuality, setConnectionQuality] = useState<number>(100)

    // Current transport mode in use (may differ from settings if fallback occurred)
    const [activeTransportMode, setActiveTransportMode] = useState<TransportMode>('hybrid')

    // Video call timer
    const [videoCallStartTime, setVideoCallStartTime] = useState<number | null>(null)
    const [videoCallElapsed, setVideoCallElapsed] = useState(0)

    // Video call UI state
    const [isVideoPreviewing, setIsVideoPreviewing] = useState(false)
    const [isVideoMuted, setIsVideoMuted] = useState(false)

    // Radio state
    const [radioSettings, setRadioSettings] = useState<RadioSettings>(() => {
        const saved = localStorage.getItem('rangerRadioSettings')
        if (saved) {
            try {
                return JSON.parse(saved)
            } catch { }
        }
        return {
            radioEnabled: false,
            radioVolume: 0.5,
            radioLastStation: 'soma-defcon',
            radioMinimized: true
        }
    })

    // Save radio settings to localStorage
    useEffect(() => {
        localStorage.setItem('rangerRadioSettings', JSON.stringify(radioSettings))
    }, [radioSettings])

    const handleRadioSettingsChange = (updates: Partial<RadioSettings>) => {
        setRadioSettings(prev => ({ ...prev, ...updates }))
    }

    // Meme & GIF state
    const [tenorApiKey, setTenorApiKey] = useState(() => {
        return localStorage.getItem('rangerChatTenorApiKey') || ''
    })

    useEffect(() => {
        localStorage.setItem('rangerChatTenorApiKey', tenorApiKey)
    }, [tenorApiKey])

    const wsRef = useRef<WebSocket | null>(null)
    const mediaStreamRef = useRef<MediaStream | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const processorRef = useRef<ScriptProcessorNode | null>(null)
    const ringIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const rainAlertIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const lastRainAlertRef = useRef<{ at: number; rainTime: number | null }>({ at: 0, rainTime: null })
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const chatHistoryRef = useRef<HTMLDivElement>(null)
    const callStateRef = useRef<CallState>('idle')
    const isTalkingRef = useRef(false)
    const callPartnerRef = useRef<string | null>(null)
    const selectedSpeakerRef = useRef<string>('default')

    // ============================================
    // VIDEO CALL REFS (Phase 1 - Foundation)
    // ============================================
    const localVideoRef = useRef<HTMLVideoElement>(null)
    const remoteVideoRef = useRef<HTMLVideoElement>(null)
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
    const callTypeRef = useRef<CallType>('voice')
    const videoCallTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Keep refs in sync with state (fixes closure bugs in audio processor and WebSocket handlers)
    useEffect(() => {
        callStateRef.current = callState
    }, [callState])

    useEffect(() => {
        isTalkingRef.current = isTalking
    }, [isTalking])

    useEffect(() => {
        callPartnerRef.current = callPartner
    }, [callPartner])

    useEffect(() => {
        selectedSpeakerRef.current = selectedSpeakerId
    }, [selectedSpeakerId])

    // Keep video call refs in sync with state
    useEffect(() => {
        callTypeRef.current = callType
    }, [callType])

    // Persist video settings to localStorage
    useEffect(() => {
        localStorage.setItem('rangerChatVideoSettings', JSON.stringify(videoSettings))
    }, [videoSettings])

    // Bind video streams to elements
    useEffect(() => {
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = localVideoStream
        }
    }, [localVideoStream])

    useEffect(() => {
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteVideoStream
        }
    }, [remoteVideoStream])

    // Video call timer tracking
    useEffect(() => {
        if (callType === 'video' && callState === 'in_call') {
            setVideoCallStartTime(prev => prev ?? Date.now())
            return
        }
        if (callType !== 'video' || callState === 'idle') {
            setVideoCallStartTime(null)
        }
    }, [callType, callState])

    useEffect(() => {
        if (!videoCallStartTime) {
            setVideoCallElapsed(0)
            return
        }
        const interval = setInterval(() => {
            setVideoCallElapsed(Date.now() - videoCallStartTime)
        }, 1000)
        return () => clearInterval(interval)
    }, [videoCallStartTime])

    useEffect(() => {
        if (callType !== 'video' || callState === 'idle') {
            setActiveTransportMode(videoSettings.transportMode)
        }
    }, [videoSettings.transportMode, callType, callState])

    // Keyboard shortcuts for video calls (M=mute, V=camera, Esc=end) - Added by Claude CLI
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Only active during video calls and when shortcuts are enabled
            if (callType !== 'video' || callState === 'idle' || !videoSettings.keyboardShortcuts) {
                return
            }

            // Don't trigger if user is typing in an input field
            const target = e.target as HTMLElement
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                return
            }

            switch (e.key.toLowerCase()) {
                case 'm':
                    // Toggle mute (audio)
                    setIsMuted(prev => !prev)
                    e.preventDefault()
                    break
                case 'v':
                    // Toggle camera (video)
                    setIsVideoMuted(prev => !prev)
                    e.preventDefault()
                    break
                case 'escape':
                    // End the video call
                    endVideoCall()
                    e.preventDefault()
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [callType, callState, videoSettings.keyboardShortcuts])

    // Stop preview stream when leaving settings (unless in a video call)
    useEffect(() => {
        if (view !== 'settings' && isVideoPreviewing && callType !== 'video') {
            localVideoStream?.getTracks().forEach(track => track.stop())
            setLocalVideoStream(null)
            setIsVideoPreviewing(false)
            setIsCameraOn(false)
        }
    }, [view, isVideoPreviewing, callType, localVideoStream])

    // Check for existing identity on load
    useEffect(() => {
        const checkIdentity = async () => {
            try {
                if (window.electronAPI) {
                    const hasIdentity = await window.electronAPI.identity.has()
                    if (hasIdentity) {
                        const storage = await window.electronAPI.identity.load()
                        if (storage?.identity) {
                            setIdentity(storage.identity)
                            setUsername(storage.identity.username)

                            // Check admin status
                            try {
                                const status = await window.electronAPI.admin.getStatus()
                                setAdminStatus(status)
                                console.log('[Admin] Status:', JSON.stringify(status, null, 2))
                                console.log('[Admin] isSupreme:', status.isSupreme, 'isAdmin:', status.isAdmin, 'role:', status.role)
                            } catch (e) {
                                console.log('[Admin] Could not check admin status:', e)
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error checking identity:', error)
            }
            setLoading(false)
        }
        checkIdentity()
    }, [])

    // Cool messages for hourly version check - Added by Claude CLI
    const VERSION_CHECK_MESSAGES = [
        '🛡️ Ranger HQ reports: All systems nominal. v${version} is the latest!',
        '🔍 Version scan complete. You\'re running the freshest code! v${version}',
        '✨ No updates needed - you\'re already elite! v${version}',
        '🎖️ Mission status: Software up-to-date. v${version} locked and loaded!',
        '🚀 Version check: You\'re flying at maximum velocity! v${version}',
        '⚡ System integrity verified. v${version} - Rangers lead the way!',
        '🔒 Security scan complete. v${version} is battle-ready!',
        '🌟 Code status: Peak performance. v${version} at your service!',
    ]

    // Track if this is the first update check (don't show message on initial load)
    const isFirstUpdateCheck = useRef(true)

    // Check for updates on load and every hour
    useEffect(() => {
        const checkForUpdates = async (showNoUpdateMessage = false) => {
            try {
                // Check the package.json in the repo for the latest version
                const response = await fetch(
                    `https://raw.githubusercontent.com/${GITHUB_REPO}/main/apps/ranger-chat-lite/package.json`
                )
                if (response.ok) {
                    const packageJson = await response.json()
                    const remoteVersion = packageJson.version

                    // Compare versions (simple string comparison works for semver)
                    if (remoteVersion && remoteVersion !== APP_VERSION) {
                        // Check if remote version is newer
                        const current = APP_VERSION.split('.').map(Number)
                        const remote = remoteVersion.split('.').map(Number)

                        let isNewer = false
                        for (let i = 0; i < 3; i++) {
                            if (remote[i] > current[i]) {
                                isNewer = true
                                break
                            } else if (remote[i] < current[i]) {
                                break
                            }
                        }

                        if (isNewer) {
                            setLatestVersion(remoteVersion)
                            setUpdateAvailable(true)
                            console.log(`Update available: v${remoteVersion} (current: v${APP_VERSION})`)

                            // Show update notification in chat if connected
                            if (showNoUpdateMessage && connected) {
                                setMessages(prev => [...prev, {
                                    type: 'system',
                                    sender: 'System',
                                    content: `🚀 NEW VERSION DETECTED! v${remoteVersion} is now available (you have v${APP_VERSION}). Type /update to install!`,
                                    timestamp: new Date().toLocaleTimeString()
                                }])
                            }
                        } else if (showNoUpdateMessage && connected) {
                            // No update available - show cool message
                            const randomMessage = VERSION_CHECK_MESSAGES[Math.floor(Math.random() * VERSION_CHECK_MESSAGES.length)]
                            const formattedMessage = randomMessage.replace(/\${version}/g, APP_VERSION)
                            setMessages(prev => [...prev, {
                                type: 'system',
                                sender: 'System',
                                content: formattedMessage,
                                timestamp: new Date().toLocaleTimeString()
                            }])
                        }
                    } else if (showNoUpdateMessage && connected) {
                        // Same version - show cool message
                        const randomMessage = VERSION_CHECK_MESSAGES[Math.floor(Math.random() * VERSION_CHECK_MESSAGES.length)]
                        const formattedMessage = randomMessage.replace(/\${version}/g, APP_VERSION)
                        setMessages(prev => [...prev, {
                            type: 'system',
                            sender: 'System',
                            content: formattedMessage,
                            timestamp: new Date().toLocaleTimeString()
                        }])
                    }
                }
            } catch (error) {
                console.log('Could not check for updates:', error)
            }
        }

        // Check immediately (silent) and then every hour (with message)
        checkForUpdates(false) // Initial check - no message

        const interval = setInterval(() => {
            checkForUpdates(true) // Hourly check - show message
        }, 60 * 60 * 1000) // 1 hour

        return () => clearInterval(interval)
    }, [connected])

    // Handle in-app update (git pull + npm install + reload) - Improved by Claude CLI
    const handleRunUpdate = async () => {
        if (!window.electronAPI?.app) {
            setUpdateError('Update feature requires Electron app')
            setMessages(prev => [...prev, {
                type: 'system',
                sender: 'System',
                content: '❌ Update feature requires Electron app',
                timestamp: new Date().toLocaleTimeString()
            }])
            return
        }

        setIsUpdating(true)
        setUpdateStatus('Pulling latest changes...')
        setUpdateError('')

        setMessages(prev => [...prev, {
            type: 'system',
            sender: 'System',
            content: '📥 Downloading updates from GitHub...',
            timestamp: new Date().toLocaleTimeString()
        }])

        try {
            const result = await window.electronAPI.app.runUpdate()

            // Handle packaged app - can't use git pull
            if (result.isPackaged) {
                setUpdateStatus('📦 Packaged App')
                setUpdateError('Download the latest version from GitHub releases to update.')
                setMessages(prev => [...prev, {
                    type: 'system',
                    sender: 'System',
                    content: '📦 This is a packaged app. Please download the latest version from GitHub releases.',
                    timestamp: new Date().toLocaleTimeString()
                }])
                setIsUpdating(false)
                return
            }

            if (!result.success) {
                const errorMsg = !result.gitPull.success
                    ? `Git pull failed: ${result.gitPull.error}`
                    : `npm install failed: ${result.npmInstall.error}`
                setUpdateError(errorMsg)
                setMessages(prev => [...prev, {
                    type: 'system',
                    sender: 'System',
                    content: `❌ Update failed: ${errorMsg}`,
                    timestamp: new Date().toLocaleTimeString()
                }])
                setIsUpdating(false)
                return
            }

            // Check if there were changes
            if (result.gitPull.output.includes('Already up to date')) {
                setUpdateStatus('Already up to date!')
                setMessages(prev => [...prev, {
                    type: 'system',
                    sender: 'System',
                    content: `✅ Already up to date! You have the latest version (v${APP_VERSION})`,
                    timestamp: new Date().toLocaleTimeString()
                }])
                setIsUpdating(false)
                setTimeout(() => setUpdateStatus(''), 3000)
                return
            }

            // Changes were pulled, reload the app with hard refresh
            setUpdateStatus('Update complete! Refreshing...')
            setMessages(prev => [...prev, {
                type: 'system',
                sender: 'System',
                content: `✅ Update complete! Refreshing to v${latestVersion} in 2 seconds...`,
                timestamp: new Date().toLocaleTimeString()
            }])

            // Hard refresh after 2 seconds - reload the page instead of restarting Electron
            setTimeout(() => {
                // Clear any cached data that might cause issues
                setUpdateAvailable(false)
                setLatestVersion(null)
                // Hard refresh - this reloads the renderer process without restarting Electron
                window.location.reload()
            }, 2000)
        } catch (error: any) {
            setUpdateError(`Update failed: ${error.message}`)
            setMessages(prev => [...prev, {
                type: 'system',
                sender: 'System',
                content: `❌ Update failed: ${error.message}`,
                timestamp: new Date().toLocaleTimeString()
            }])
            setIsUpdating(false)
        }
    }

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Load theme from localStorage
    useEffect(() => {
        const savedTheme = localStorage.getItem('rangerChatTheme') as ThemeName
        if (savedTheme && THEMES[savedTheme]) {
            setTheme(savedTheme)
        }
    }, [])

    // Save theme to localStorage
    useEffect(() => {
        localStorage.setItem('rangerChatTheme', theme)
        document.documentElement.setAttribute('data-theme', theme)
    }, [theme])

    // Save update notifications preference
    useEffect(() => {
        localStorage.setItem('rangerChatUpdateNotifications', updateNotificationsEnabled.toString())
    }, [updateNotificationsEnabled])

    useEffect(() => {
        localStorage.setItem(RAIN_ALERTS_ENABLED_KEY, rainAlertsEnabled.toString())
    }, [rainAlertsEnabled])

    useEffect(() => {
        localStorage.setItem(RAIN_ALERT_LOOKAHEAD_KEY, rainAlertLookaheadHours.toString())
    }, [rainAlertLookaheadHours])

    // Save login picture preference
    useEffect(() => {
        localStorage.setItem('rangerChatLoginPicture', loginPicture)
    }, [loginPicture])

    // Handle login picture upload with resize
    const handleLoginPictureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        // Check file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file')
            return
        }

        const reader = new FileReader()
        reader.onload = (e) => {
            const img = new Image()
            img.onload = () => {
                // Resize to 128x128 for login logo
                const canvas = document.createElement('canvas')
                const size = 128
                canvas.width = size
                canvas.height = size
                const ctx = canvas.getContext('2d')
                if (ctx) {
                    // Calculate crop to make it square
                    const minDim = Math.min(img.width, img.height)
                    const sx = (img.width - minDim) / 2
                    const sy = (img.height - minDim) / 2

                    // Draw image with circular mask consideration (just crop to square)
                    ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size)

                    // Convert to base64
                    const base64 = canvas.toDataURL('image/png', 0.9)
                    setLoginPicture(base64)
                }
            }
            img.src = e.target?.result as string
        }
        reader.readAsDataURL(file)

        // Reset input so same file can be selected again
        event.target.value = ''
    }

    const saveWeatherLocation = (location: WeatherLocation) => {
        setWeatherLocation(location)
        setWeatherStatus('ready')
        setWeatherError(null)
        localStorage.setItem(WEATHER_LOCATION_STORAGE_KEY, JSON.stringify(location))
    }

    const formatLocationAge = (timestamp: number) => {
        const minutes = Math.round((Date.now() - timestamp) / 60000)
        if (minutes < 1) return 'just now'
        if (minutes < 60) return `${minutes}m ago`
        const hours = Math.round(minutes / 60)
        return `${hours}h ago`
    }

    const fetchJson = async (url: string) => {
        const response = await fetch(url)
        if (!response.ok) {
            throw new Error(`Request failed (${response.status})`)
        }
        return response.json()
    }

    const reverseGeocode = async (lat: number, lon: number) => {
        try {
            const url = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&count=1&language=en`
            const data = await fetchJson(url)
            const place = data?.results?.[0]
            if (!place) return null
            return [place.name, place.admin1, place.country_code].filter(Boolean).join(', ')
        } catch (error) {
            console.warn('Reverse geocode failed:', error)
            return null
        }
    }

    const detectLocationByIP = async () => {
        setWeatherStatus('loading')
        setWeatherError(null)
        const data = await fetchJson('https://ipapi.co/json/')
        if (!data?.latitude || !data?.longitude) {
            throw new Error('IP location unavailable')
        }
        const label = [data.city, data.region, data.country_name].filter(Boolean).join(', ')
        const location: WeatherLocation = {
            lat: data.latitude,
            lon: data.longitude,
            label: label || `${data.latitude.toFixed(2)}, ${data.longitude.toFixed(2)}`,
            source: 'ip',
            updatedAt: Date.now()
        }
        saveWeatherLocation(location)
        return location
    }

    const detectLocationByGPS = async () => {
        if (!navigator.geolocation) {
            throw new Error('Geolocation is not available')
        }

        setWeatherStatus('loading')
        setWeatherError(null)
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 10 * 60 * 1000
            })
        })

        const lat = position.coords.latitude
        const lon = position.coords.longitude
        const label = (await reverseGeocode(lat, lon)) || `${lat.toFixed(2)}, ${lon.toFixed(2)}`
        const location: WeatherLocation = {
            lat,
            lon,
            label,
            source: 'gps',
            updatedAt: Date.now()
        }
        saveWeatherLocation(location)
        return location
    }

    const ensureWeatherLocation = async () => {
        if (weatherLocation && Date.now() - weatherLocation.updatedAt < WEATHER_LOCATION_MAX_AGE_MS) {
            return weatherLocation
        }
        try {
            return await detectLocationByIP()
        } catch (error: any) {
            setWeatherStatus('error')
            setWeatherError(error?.message || 'Unable to detect location')
            return null
        }
    }

    const geocodeLocation = async (query: string) => {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`
        const data = await fetchJson(url)
        const result = data?.results?.[0]
        if (!result) {
            throw new Error('Location not found')
        }
        const label = [result.name, result.admin1, result.country_code].filter(Boolean).join(', ')
        return {
            lat: result.latitude,
            lon: result.longitude,
            label: label || `${result.latitude.toFixed(2)}, ${result.longitude.toFixed(2)}`
        }
    }

    const describeWeatherCode = (code: number) => {
        if (code in WEATHER_CODE_LABELS) return WEATHER_CODE_LABELS[code]
        return 'Unknown conditions'
    }

    const fetchWeatherData = async (lat: number, lon: number) => {
        const url = new URL('https://api.open-meteo.com/v1/forecast')
        url.searchParams.set('latitude', lat.toString())
        url.searchParams.set('longitude', lon.toString())
        url.searchParams.set('current', 'temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m')
        url.searchParams.set('hourly', 'temperature_2m,precipitation,precipitation_probability,weather_code')
        url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code')
        url.searchParams.set('forecast_days', '3')
        url.searchParams.set('timezone', 'auto')
        return fetchJson(url.toString())
    }

    const getRainWindow = (data: any, hoursAhead: number): { firstRain: { time: number; precip: number; prob: number } | null, maxProb: number, maxPrecip: number } => {
        const now = Date.now()
        const times: string[] = data?.hourly?.time || []
        const precipitation: number[] = data?.hourly?.precipitation || []
        const probability: number[] = data?.hourly?.precipitation_probability || []

        let firstRain: { time: number; precip: number; prob: number } | null = null
        let maxProb = 0
        let maxPrecip = 0

        times.forEach((time, index) => {
            const timestamp = new Date(time).getTime()
            const hoursFromNow = (timestamp - now) / (1000 * 60 * 60)
            if (hoursFromNow <= 0 || hoursFromNow > hoursAhead) return

            const precip = precipitation[index] ?? 0
            const prob = probability[index] ?? 0
            maxProb = Math.max(maxProb, prob)
            maxPrecip = Math.max(maxPrecip, precip)

            if (!firstRain && (precip >= 0.5 || prob >= 60)) {
                firstRain = { time: timestamp, precip, prob }
            }
        })

        return { firstRain, maxProb, maxPrecip }
    }

    const buildWeatherMessage = (label: string, data: any) => {
        const current = data?.current
        if (!current) throw new Error('Weather data missing')

        const temp = Math.round(current.temperature_2m)
        const feels = Math.round(current.apparent_temperature)
        const wind = Math.round(current.wind_speed_10m)
        const condition = describeWeatherCode(current.weather_code)

        const { maxProb, maxPrecip } = getRainWindow(data, 3)
        const rainSummary = maxProb > 0 || maxPrecip > 0
            ? `Next 3h rain chance: ${Math.round(maxProb)}% (max ${maxPrecip.toFixed(1)}mm)`
            : 'Next 3h: no rain detected'

        return `Weather: ${label} | ${temp}C (feels ${feels}C) | ${condition} | Wind ${wind} km/h | ${rainSummary}`
    }

    const handleWeatherCommand = async (query?: string) => {
        try {
            const trimmed = query?.trim()
            const location = trimmed ? await geocodeLocation(trimmed) : await ensureWeatherLocation()
            if (!location) {
                setMessages(prev => [...prev, {
                    type: 'system',
                    sender: 'System',
                    content: 'Weather: unable to detect your location.',
                    timestamp: new Date().toLocaleTimeString()
                }])
                return
            }

            const data = await fetchWeatherData(location.lat, location.lon)
            const message = buildWeatherMessage(location.label, data)
            setMessages(prev => [...prev, {
                type: 'chat',
                sender: 'Weather',
                content: message,
                timestamp: new Date().toLocaleTimeString()
            }])
        } catch (error: any) {
            setMessages(prev => [...prev, {
                type: 'system',
                sender: 'System',
                content: `Weather error: ${error?.message || 'Unable to fetch weather.'}`,
                timestamp: new Date().toLocaleTimeString()
            }])
        }
    }

    const checkForRainAlert = async () => {
        if (!rainAlertsEnabled || view === 'login') return

        const location = await ensureWeatherLocation()
        if (!location) return

        try {
            const data = await fetchWeatherData(location.lat, location.lon)
            const { firstRain } = getRainWindow(data, rainAlertLookaheadHours)

            if (!firstRain) {
                lastRainAlertRef.current.rainTime = null
                return
            }

            const now = Date.now()
            const hoursUntil = (firstRain.time - now) / (1000 * 60 * 60)
            const lastAlert = lastRainAlertRef.current

            if (lastAlert.rainTime === firstRain.time && now - lastAlert.at < 60 * 60 * 1000) {
                return
            }

            lastRainAlertRef.current = { at: now, rainTime: firstRain.time }
            const eta = hoursUntil < 1 ? `${Math.max(1, Math.round(hoursUntil * 60))} min` : `${Math.round(hoursUntil)} hr`
            const detail = firstRain.prob ? `${Math.round(firstRain.prob)}% chance` : `${firstRain.precip.toFixed(1)}mm`
            setMessages(prev => [...prev, {
                type: 'system',
                sender: 'System',
                content: `Rain alert: ${location.label} in about ${eta} (${detail}).`,
                timestamp: new Date().toLocaleTimeString()
            }])
        } catch (error) {
            console.warn('Rain alert check failed:', error)
        }
    }

    useEffect(() => {
        if (!rainAlertsEnabled) {
            if (rainAlertIntervalRef.current) {
                clearInterval(rainAlertIntervalRef.current)
                rainAlertIntervalRef.current = null
            }
            return
        }

        void checkForRainAlert()
        rainAlertIntervalRef.current = setInterval(checkForRainAlert, RAIN_ALERT_CHECK_INTERVAL_MS)

        return () => {
            if (rainAlertIntervalRef.current) {
                clearInterval(rainAlertIntervalRef.current)
                rainAlertIntervalRef.current = null
            }
        }
    }, [rainAlertsEnabled, rainAlertLookaheadHours, view, weatherLocation])

    // Load ledger status when entering ledger view
    const loadLedgerData = async () => {
        if (!window.electronAPI?.ledger) return
        setLedgerLoading(true)
        try {
            const status = await window.electronAPI.ledger.getStatus()
            setLedgerStatus(status)
            const blocks = await window.electronAPI.ledger.getBlocks(0, 20)
            setLedgerBlocks(blocks.reverse()) // Newest first
        } catch (error) {
            console.error('Error loading ledger:', error)
        }
        setLedgerLoading(false)
    }

    // Refresh ledger data
    const refreshLedger = async () => {
        await loadLedgerData()
    }

    // Manual mine block
    const manualMineBlock = async () => {
        if (!window.electronAPI?.ledger) return
        setLedgerLoading(true)
        try {
            const block = await window.electronAPI.ledger.mineBlock(identity?.nodeId)
            if (block) {
                await loadLedgerData()
            }
        } catch (error) {
            console.error('Error mining block:', error)
        }
        setLedgerLoading(false)
    }

    // Export chain
    const exportChain = async () => {
        if (!window.electronAPI?.ledger) return
        try {
            const chainData = await window.electronAPI.ledger.exportChain()
            const blob = new Blob([JSON.stringify(chainData, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `rangerblock-chain-${Date.now()}.json`
            a.click()
            URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Error exporting chain:', error)
        }
    }

    // Format timestamp
    const formatTime = (ts: number) => {
        const date = new Date(ts)
        return date.toLocaleString()
    }

    // Format hash for display
    const formatHash = (hash: string) => {
        if (!hash) return 'N/A'
        return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`
    }

    // Generate random username
    const generateRandomUsername = async () => {
        setIsGenerating(true)
        try {
            if (window.electronAPI) {
                const newName = await window.electronAPI.identity.generateUsername()
                setUsername(newName)
            } else {
                // Fallback for browser dev
                const adjectives = ['Cosmic', 'Cyber', 'Digital', 'Electric', 'Quantum', 'Turbo', 'Mega', 'Ultra']
                const nouns = ['Ranger', 'Phoenix', 'Dragon', 'Wolf', 'Falcon', 'Tiger', 'Hawk', 'Eagle']
                const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
                const noun = nouns[Math.floor(Math.random() * nouns.length)]
                const num = Math.floor(Math.random() * 100)
                setUsername(`${adj}${noun}${num}`)
            }
        } catch (error) {
            console.error('Error generating username:', error)
        }
        // Animation delay
        setTimeout(() => setIsGenerating(false), 300)
    }

    // Log blockchain transaction
    const logTransaction = (
        type: BlockchainTx['type'],
        direction: BlockchainTx['direction'],
        from: string,
        to: string,
        payload: any,
        status: BlockchainTx['status'] = 'confirmed'
    ) => {
        const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload)
        const tx: BlockchainTx = {
            id: `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2, 6)}`,
            type,
            direction,
            from,
            to,
            payload: payloadStr.length > 100 ? payloadStr.substring(0, 100) + '...' : payloadStr,
            size: new Blob([payloadStr]).size,
            timestamp: Date.now(),
            status
        }
        setTransactions(prev => [tx, ...prev].slice(0, 100)) // Keep last 100 transactions
        setTxStats(prev => ({
            sent: direction === 'out' ? prev.sent + 1 : prev.sent,
            received: direction === 'in' ? prev.received + 1 : prev.received,
            total: prev.total + 1,
            bytes: prev.bytes + tx.size
        }))
    }

    // Connect to server
    const connect = async () => {
        if (!username.trim()) {
            alert('Please choose a username first!')
            return
        }

        // Create or update identity
        try {
            if (window.electronAPI) {
                const newIdentity = await window.electronAPI.identity.getOrCreate(username)
                setIdentity(newIdentity)
            }
        } catch (error) {
            console.error('Error creating identity:', error)
        }

        // Connect to WebSocket
        if (wsRef.current) wsRef.current.close()
        const nodeId = identity?.nodeId || `lite-${Math.random().toString(36).substring(2, 10)}`
        const ws = new WebSocket(serverUrl)

        ws.onopen = () => {
            logTransaction('system', 'in', 'relay-server', nodeId, 'WebSocket connected', 'confirmed')
            setMessages(prev => [...prev, {
                type: 'system',
                sender: 'System',
                content: 'Connected to server, waiting for welcome...',
                timestamp: new Date().toLocaleTimeString()
            }])
        }

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)
                // Log incoming transaction
                logTransaction(
                    data.type === 'broadcast' || data.type === 'nodeMessage' ? 'receive' : 'system',
                    'in',
                    data.from || 'relay-server',
                    nodeId,
                    data,
                    'confirmed'
                )

                switch (data.type) {
                    case 'welcome':
                        const registerMsg = {
                            type: 'register',
                            address: nodeId,
                            userId: identity?.userId,
                            nickname: username,
                            channel: '#rangers',
                            ip: '0.0.0.0',
                            port: 0,
                            mode: 'lite-client',
                            capabilities: ['chat', 'voice', 'call']
                        }
                        ws.send(JSON.stringify(registerMsg))
                        logTransaction('system', 'out', nodeId, 'relay-server', registerMsg, 'broadcast')
                        break
                    case 'registered':
                        setConnected(true)
                        setView('chat')
                        setMessages(prev => [...prev, {
                            type: 'system',
                            sender: 'System',
                            content: `Registered as ${username}`,
                            timestamp: new Date().toLocaleTimeString()
                        }])
                        const getPeersMsg = { type: 'getPeers' }
                        ws.send(JSON.stringify(getPeersMsg))
                        logTransaction('peer', 'out', nodeId, 'relay-server', getPeersMsg, 'broadcast')
                        break
                    case 'peerList':
                        const rawPeerList = data.peers || []
                        const normalizedPeers = rawPeerList
                            .map((p: any) => typeof p === 'string' ? { nickname: p, capabilities: [], status: 'online' } : p)
                            .filter((p: PeerInfo) => p && p.nickname && p.nickname !== username)

                        setPeers(normalizedPeers)
                        setPeerCount(normalizedPeers.length)
                        setMessages(prev => {
                            const newMessages = [...prev, {
                                type: 'system',
                                sender: 'System',
                                content: `${normalizedPeers.length} peer(s) online`,
                                timestamp: new Date().toLocaleTimeString()
                            }]

                            // Show update notification after welcome if update is available
                            if (updateAvailable && latestVersion) {
                                newMessages.push({
                                    type: 'system',
                                    sender: 'System',
                                    content: `🚀 UPDATE AVAILABLE! You are on v${APP_VERSION}, latest is v${latestVersion}. Type /update to install, then the app will refresh automatically.`,
                                    timestamp: new Date().toLocaleTimeString()
                                })
                            }

                            return newMessages
                        })
                        break
                    case 'peerListUpdate':
                        const rawUpdatedPeers = data.peers || []
                        const normalizedUpdatedPeers = rawUpdatedPeers
                            .map((p: any) => typeof p === 'string' ? { nickname: p, capabilities: [], status: 'online' } : p)
                            .filter((p: PeerInfo) => p && p.nickname && p.nickname !== username)

                        setPeers(normalizedUpdatedPeers)
                        setPeerCount(normalizedUpdatedPeers.length)
                        break
                    case 'broadcast':
                    case 'nodeMessage':
                        if (data.payload) {
                            // Pass sender info from root level if not in payload
                            const enrichedPayload = {
                                ...data.payload,
                                nickname: data.payload.nickname || data.fromName || data.from,
                                from: data.payload.from || data.fromNodeId || data.from
                            }
                            handlePayload(enrichedPayload)
                        }
                        break
                    case 'broadcastSent':
                        break
                    default:
                        console.log('Unknown message type:', data.type)
                }
            } catch (e) {
                console.error('Failed to parse message', e)
            }
        }

        ws.onclose = () => {
            logTransaction('system', 'in', 'relay-server', nodeId, 'WebSocket disconnected', 'confirmed')
            setConnected(false)
            setMessages(prev => [...prev, {
                type: 'system',
                sender: 'System',
                content: 'Disconnected from server',
                timestamp: new Date().toLocaleTimeString()
            }])
        }

        ws.onerror = (error) => {
            logTransaction('system', 'in', 'relay-server', nodeId, 'Connection error', 'confirmed')
            console.error('WebSocket error:', error)
            setMessages(prev => [...prev, {
                type: 'system',
                sender: 'System',
                content: 'Connection error',
                timestamp: new Date().toLocaleTimeString()
            }])
        }

        wsRef.current = ws
    }

    const handlePayload = (payload: any) => {
        // Handle voice-related payloads
        if (['callRequest', 'callAccepted', 'callRejected', 'callBusy', 'callEnded', 'voiceData', 'voiceStatus'].includes(payload.type)) {
            handleVoicePayload(payload)
            return
        }

        // Handle video-related payloads (Phase 2 - Signaling Protocol)  
        if (['videoCallRequest', 'videoCallAccepted', 'videoCallRejected', 'videoCallBusy', 'videoCallEnded', 'videoOffer', 'videoAnswer', 'iceCandidate'].includes(payload.type)) {
            handleVideoPayload(payload)
            return
        }

        switch (payload.type) {
            case 'chatMessage':
            case 'chat':
                setMessages(prev => [...prev, {
                    type: 'chat',
                    sender: payload.nickname || payload.from || 'Unknown',
                    senderId: payload.userId,  // Track userId for moderation
                    content: payload.message || payload.content || '',
                    timestamp: new Date().toLocaleTimeString()
                }])
                break
            default:
                console.log('Unknown payload type:', payload.type)
        }
    }

    const sendMessage = async () => {
        const trimmedInput = input.trim()
        if (!trimmedInput) return

        // Handle /weather command
        if (weatherMatch) {
            await handleWeatherCommand(weatherMatch[1])
            setInput('')
            return
        }

        // Handle /meme command
        const memeMatch = trimmedInput.match(/^\/meme(?:\s+(.+))?$/i)
        let processedContent = trimmedInput

        if (memeMatch) {
            try {
                const sub = memeMatch[1] ? memeMatch[1].trim() : ''
                const url = sub ? `https://meme-api.com/gimme/${sub}` : 'https://meme-api.com/gimme'
                const res = await fetch(url)
                const data = await res.json()
                if (data.url) {
                    processedContent = `![${data.title}](${data.url})`
                } else {
                    setMessages(prev => [...prev, {
                        type: 'system',
                        sender: 'System',
                        content: `❌ No meme found${sub ? ` in r/${sub}` : ''}.`,
                        timestamp: new Date().toLocaleTimeString()
                    }])
                    setInput('')
                    return
                }
            } catch (e) {
                console.error('Meme fetch failed', e)
                setMessages(prev => [...prev, {
                    type: 'system',
                    sender: 'System',
                    content: '❌ Failed to fetch meme.',
                    timestamp: new Date().toLocaleTimeString()
                }])
                setInput('')
                return
            }
        }

        // Handle /gif command
        const gifMatch = trimmedInput.match(/^\/gif\s+(.+)$/i)
        if (gifMatch) {
            if (!tenorApiKey) {
                setMessages(prev => [...prev, {
                    type: 'system',
                    sender: 'System',
                    content: '⚠️ Please set your Tenor API Key in Settings to use /gif.',
                    timestamp: new Date().toLocaleTimeString()
                }])
                setInput('')
                return
            }
            try {
                const query = gifMatch[1].trim()
                const url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${tenorApiKey}&limit=1`
                const res = await fetch(url)
                const data = await res.json()
                if (data.results && data.results.length > 0) {
                    const gifUrl = data.results[0].media_formats.gif.url
                    processedContent = `![${query}](${gifUrl})`
                } else {
                    setMessages(prev => [...prev, {
                        type: 'system',
                        sender: 'System',
                        content: `❌ No GIF found for "${query}".`,
                        timestamp: new Date().toLocaleTimeString()
                    }])
                    setInput('')
                    return
                }
            } catch (e) {
                console.error('GIF fetch failed', e)
                setMessages(prev => [...prev, {
                    type: 'system',
                    sender: 'System',
                    content: '❌ Failed to fetch GIF.',
                    timestamp: new Date().toLocaleTimeString()
                }])
                setInput('')
                return
            }
        }

        if (!wsRef.current || !connected) return

        // Handle /call command (voice call)
        const callMatch = trimmedInput.match(/^\/call\s+(.+)$/i)
        if (callMatch) {
            const targetUser = callMatch[1].trim()
            if (targetUser) {
                makeCall(targetUser)
                setInput('')
                return
            }
        }

        // Handle /video command (video call) - Added by Claude CLI
        const videoMatch = trimmedInput.match(/^\/video\s+(.+)$/i)
        if (videoMatch) {
            const targetUser = videoMatch[1].trim()
            if (targetUser) {
                makeVideoCall(targetUser)
                setInput('')
                return
            }
        }

        // Handle /hangup command
        if (trimmedInput.toLowerCase() === '/hangup' || trimmedInput.toLowerCase() === '/end') {
            if (callState !== 'idle') {
                hangUp()
            } else {
                setMessages(prev => [...prev, {
                    type: 'system',
                    sender: 'System',
                    content: 'Not in a call',
                    timestamp: new Date().toLocaleTimeString()
                }])
            }
            setInput('')
            return
        }

        // Handle /peers command
        if (trimmedInput.toLowerCase() === '/peers' || trimmedInput.toLowerCase() === '/online') {
            if (peers.length === 0) {
                setMessages(prev => [...prev, {
                    type: 'system',
                    sender: 'System',
                    content: 'No other peers online.',
                    timestamp: new Date().toLocaleTimeString()
                }])
            } else {
                const peerList = peers.map(p => `  • ${p.nickname}${p.capabilities?.includes('voice') ? ' 🎙️' : ''}`).join('\n')
                setMessages(prev => [...prev, {
                    type: 'system',
                    sender: 'System',
                    content: `Online peers:\n${peerList}`,
                    timestamp: new Date().toLocaleTimeString()
                }])
            }
            setInput('')
            return
        }
        return
    }

    // Handle /update command - Added by Claude CLI
    if (trimmedInput.toLowerCase() === '/update') {
        if (!updateAvailable) {
            setMessages(prev => [...prev, {
                type: 'system',
                sender: 'System',
                content: `✅ You're already on the latest version (v${APP_VERSION})`,
                timestamp: new Date().toLocaleTimeString()
            }])
        } else {
            setMessages(prev => [...prev, {
                type: 'system',
                sender: 'System',
                content: `🔄 Updating from v${APP_VERSION} to v${latestVersion}...`,
                timestamp: new Date().toLocaleTimeString()
            }])
            // Run the update
            handleRunUpdate()
        }
        setInput('')
        return
    }

    // Handle /version command - Added by Claude CLI
    if (trimmedInput.toLowerCase() === '/version') {
        const versionInfo = updateAvailable
            ? `Current: v${APP_VERSION} | Latest: v${latestVersion} (update available - type /update)`
            : `v${APP_VERSION} (up to date)`
        setMessages(prev => [...prev, {
            type: 'system',
            sender: 'System',
            content: `RangerChat Lite ${versionInfo}`,
            timestamp: new Date().toLocaleTimeString()
        }])
        setInput('')
        return
    }

    const msg = {
        type: 'broadcast',
        payload: {
            type: 'chatMessage',
            from: identity?.nodeId,
            userId: identity?.userId,  // Include for moderation
            nickname: username,
            message: input,
            timestamp: Date.now()
        }
    }

    wsRef.current.send(JSON.stringify(msg))
    // Log outgoing chat transaction
    logTransaction('send', 'out', identity?.nodeId || 'local', 'broadcast', msg, 'broadcast')

    setMessages(prev => [...prev, {
        type: 'chat',
        sender: username,
        senderId: identity?.userId,
        content: input,
        timestamp: new Date().toLocaleTimeString()
    }])
    setInput('')

    // Record message for stats
    try {
        if (window.electronAPI) {
            await window.electronAPI.identity.recordMessage()
        }
    } catch (error) {
        console.error('Error recording message:', error)
    }
}

const insertEmoji = (emoji: string) => {
    setInput(prev => prev + emoji)
}

const getFilteredEmojis = () => {
    const categoryEmojis = EMOJI_DATA[emojiCategory]
    if (!emojiSearch) return categoryEmojis
    const allEmojis = Object.values(EMOJI_DATA).flat()
    return allEmojis.filter(emoji => emoji.includes(emojiSearch))
}

const getFilteredMessages = () => {
    if (!searchQuery) return messages
    return messages.filter(msg =>
        msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.sender.toLowerCase().includes(searchQuery.toLowerCase())
    )
}

const cycleTheme = () => {
    const themeOrder: ThemeName[] = ['classic', 'matrix', 'tron', 'retro']
    const currentIndex = themeOrder.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themeOrder.length
    setTheme(themeOrder[nextIndex])
}

// ═══════════════════════════════════════════════════════════════════════════
// VOICE CALL FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

// Enumerate available audio input and output devices
const loadAudioDevices = async () => {
    try {
        console.log('[Voice] Requesting microphone permission...')
        // Need to request permission first to get device labels
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        // Stop the stream immediately - we just needed permission
        stream.getTracks().forEach(track => track.stop())

        const devices = await navigator.mediaDevices.enumerateDevices()
        const audioInputs = devices.filter(d => d.kind === 'audioinput')
        const audioOutputs = devices.filter(d => d.kind === 'audiooutput')
        console.log('[Voice] Found input devices:', audioInputs.length, audioInputs.map(d => d.label || d.deviceId))
        console.log('[Voice] Found output devices:', audioOutputs.length, audioOutputs.map(d => d.label || d.deviceId))
        setAudioDevices(audioInputs)
        setAudioOutputDevices(audioOutputs)

        // If we have a saved preference, validate it still exists
        if (selectedMicId !== 'default') {
            const exists = audioInputs.some(d => d.deviceId === selectedMicId)
            if (!exists) {
                console.log('[Voice] Previously selected mic not found, using default')
                setSelectedMicId('default')
            }
        }
        // Validate speaker selection
        if (selectedSpeakerId !== 'default') {
            const exists = audioOutputs.some(d => d.deviceId === selectedSpeakerId)
            if (!exists) {
                console.log('[Voice] Previously selected speaker not found, using default')
                setSelectedSpeakerId('default')
            }
        }
    } catch (error: unknown) {
        console.error('[Voice] Error enumerating audio devices:', error)
        // Still try to enumerate without labels
        try {
            const devices = await navigator.mediaDevices.enumerateDevices()
            const audioInputs = devices.filter(d => d.kind === 'audioinput')
            const audioOutputs = devices.filter(d => d.kind === 'audiooutput')
            console.log('[Voice] Found devices without labels:', audioInputs.length, 'inputs,', audioOutputs.length, 'outputs')
            setAudioDevices(audioInputs)
            setAudioOutputDevices(audioOutputs)
        } catch (e) {
            console.error('[Voice] Cannot enumerate devices:', e)
        }
    }
}

// Initialize audio context for playback with optional output device
const initAudioContext = async (speakerId?: string) => {
    const targetSinkId = speakerId || selectedSpeakerRef.current

    if (!audioContextRef.current) {
        // Create new AudioContext
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        console.log('[Voice] Created new AudioContext')
    }

    // Try to set the output device if specified and not default
    if (targetSinkId && targetSinkId !== 'default' && audioContextRef.current) {
        try {
            // setSinkId is available in Chromium-based browsers (including Electron)
            if (typeof (audioContextRef.current as any).setSinkId === 'function') {
                await (audioContextRef.current as any).setSinkId(targetSinkId)
                console.log('[Voice] AudioContext output set to:', targetSinkId)
            }
        } catch (e) {
            console.warn('[Voice] Could not set audio output device:', e)
        }
    }

    return audioContextRef.current
}

// Start audio capture
const startAudioCapture = async () => {
    try {
        console.log('[Voice] Starting audio capture with mic:', selectedMicId)
        // Build audio constraints with selected device
        const audioConstraints: MediaTrackConstraints = {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
        }
        // Only add deviceId if not 'default'
        if (selectedMicId && selectedMicId !== 'default') {
            audioConstraints.deviceId = { exact: selectedMicId }
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints })
        console.log('[Voice] Got microphone stream:', stream.getAudioTracks()[0]?.label || 'Unknown')
        mediaStreamRef.current = stream

        const audioContext = await initAudioContext()
        console.log('[Voice] AudioContext state:', audioContext.state, 'sampleRate:', audioContext.sampleRate)

        // Resume audio context if suspended (required by browser autoplay policy)
        if (audioContext.state === 'suspended') {
            await audioContext.resume()
            console.log('[Voice] AudioContext resumed')
        }

        const source = audioContext.createMediaStreamSource(stream)
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 256
        analyserRef.current = analyser

        // Create script processor for capturing audio
        const processor = audioContext.createScriptProcessor(4096, 1, 1)
        processorRef.current = processor

        source.connect(analyser)
        analyser.connect(processor)
        processor.connect(audioContext.destination)
        console.log('[Voice] Audio pipeline connected')

        let frameCount = 0
        processor.onaudioprocess = (e) => {
            // Use refs for current values (fixes closure bug)
            const talking = isTalkingRef.current
            const ws = wsRef.current
            const state = callStateRef.current
            const partner = callPartnerRef.current

            if (!talking || !ws || state !== 'in_call') {
                // Log occasionally to show processor is running
                frameCount++
                if (frameCount % 100 === 0) {
                    console.log('[Voice] Waiting... talking:', talking, 'ws:', !!ws, 'state:', state, 'partner:', partner)
                }
                return
            }

            const inputData = e.inputBuffer.getChannelData(0)
            const audioData = new Float32Array(inputData)

            // Calculate audio level
            let sum = 0
            for (let i = 0; i < audioData.length; i++) {
                sum += Math.abs(audioData[i])
            }
            const level = Math.min(100, Math.round((sum / audioData.length) * 300))
            setAudioLevel(level)

            // Convert to base64 and send
            const int16Data = new Int16Array(audioData.length)
            for (let i = 0; i < audioData.length; i++) {
                int16Data[i] = Math.max(-32768, Math.min(32767, audioData[i] * 32767))
            }

            const base64Audio = btoa(String.fromCharCode(...new Uint8Array(int16Data.buffer)))

            console.log('[Voice] SENDING audio to', partner, 'level:', level, 'bytes:', base64Audio.length)

            ws.send(JSON.stringify({
                type: 'broadcast',
                payload: {
                    type: 'voiceData',
                    from: identity?.nodeId,
                    nickname: username,
                    audio: base64Audio,
                    sampleRate: audioContextRef.current?.sampleRate || 48000, // Include sample rate for proper playback
                    target: partner,
                    timestamp: Date.now()
                }
            }))
        }

        console.log('[Voice] Audio capture started successfully')
        return true
    } catch (error) {
        console.error('[Voice] Error accessing microphone:', error)
        setMessages(prev => [...prev, {
            type: 'system',
            sender: 'System',
            content: 'Could not access microphone. Please grant permission.',
            timestamp: new Date().toLocaleTimeString()
        }])
        return false
    }
}

// Stop audio capture
const stopAudioCapture = () => {
    if (processorRef.current) {
        processorRef.current.disconnect()
        processorRef.current = null
    }
    if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
        mediaStreamRef.current = null
    }
    setAudioLevel(0)
}

// Play received audio on the selected speaker
const playAudio = async (base64Audio: string, from: string, sourceSampleRate?: number) => {
    if (isMuted) {
        console.log('[Voice] Muted, skipping audio from', from)
        return
    }

    try {
        // Use source sample rate if provided, otherwise assume 48000
        const originalSampleRate = sourceSampleRate || 48000
        const speakerId = selectedSpeakerRef.current
        console.log('[Voice] RECEIVING audio from', from, 'bytes:', base64Audio.length, 'sampleRate:', originalSampleRate, 'speaker:', speakerId || 'default')

        const audioContext = await initAudioContext()

        // Resume if suspended
        if (audioContext.state === 'suspended') {
            await audioContext.resume()
            console.log('[Voice] AudioContext resumed for playback')
        }

        const binaryString = atob(base64Audio)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
        }

        const int16Data = new Int16Array(bytes.buffer)
        const floatData = new Float32Array(int16Data.length)
        for (let i = 0; i < int16Data.length; i++) {
            floatData[i] = int16Data[i] / 32767
        }

        // Create buffer with the ORIGINAL sample rate from sender
        // This ensures correct playback speed/pitch
        const audioBuffer = audioContext.createBuffer(1, floatData.length, originalSampleRate)
        audioBuffer.copyToChannel(floatData, 0)

        // Create a gain node to boost volume (4x boost for better audibility)
        const gainNode = audioContext.createGain()
        gainNode.gain.value = 4.0 // Boost volume significantly

        const source = audioContext.createBufferSource()
        source.buffer = audioBuffer
        source.connect(gainNode)
        gainNode.connect(audioContext.destination)
        source.start()
        console.log('[Voice] Playing audio buffer, samples:', floatData.length, 'gain: 4.0x', 'contextRate:', audioContext.sampleRate)
    } catch (error) {
        console.error('[Voice] Error playing audio:', error)
    }
}

// Make a call
const makeCall = (targetNickname: string) => {
    if (callState !== 'idle') {
        setMessages(prev => [...prev, {
            type: 'system',
            sender: 'System',
            content: 'Already in a call. Hang up first.',
            timestamp: new Date().toLocaleTimeString()
        }])
        return
    }

    setCallType('voice')
    setCallState('calling')
    setCallPartner(targetNickname)

    wsRef.current?.send(JSON.stringify({
        type: 'broadcast',
        payload: {
            type: 'callRequest',
            from: identity?.nodeId,
            nickname: username,
            target: targetNickname,
            timestamp: Date.now()
        }
    }))

    setMessages(prev => [...prev, {
        type: 'system',
        sender: 'System',
        content: `Calling ${targetNickname}...`,
        timestamp: new Date().toLocaleTimeString()
    }])

    // Timeout after 30 seconds
    setTimeout(() => {
        if (callStateRef.current === 'calling') {
            setCallState('idle')
            setCallPartner(null)
            setMessages(prev => [...prev, {
                type: 'system',
                sender: 'System',
                content: `No answer from ${targetNickname}`,
                timestamp: new Date().toLocaleTimeString()
            }])
        }
    }, 30000)
}

// Answer incoming call
const answerCall = async () => {
    if (callState !== 'ringing' || !incomingCaller) return

    // Stop ring tone
    if (ringIntervalRef.current) {
        clearInterval(ringIntervalRef.current)
        ringIntervalRef.current = null
    }

    // Request microphone permission before answering
    const hasAudio = await startAudioCapture()
    if (!hasAudio) {
        rejectCall()
        return
    }

    setCallType('voice')
    setCallState('in_call')
    setCallPartner(incomingCaller)
    setIncomingCaller(null)

    wsRef.current?.send(JSON.stringify({
        type: 'broadcast',
        payload: {
            type: 'callAccepted',
            from: identity?.nodeId,
            nickname: username,
            target: incomingCaller,
            timestamp: Date.now()
        }
    }))

    setMessages(prev => [...prev, {
        type: 'system',
        sender: 'System',
        content: `Connected with ${incomingCaller}`,
        timestamp: new Date().toLocaleTimeString()
    }])
}

// Reject incoming call
const rejectCall = () => {
    if (callState !== 'ringing' || !incomingCaller) return

    // Stop ring tone
    if (ringIntervalRef.current) {
        clearInterval(ringIntervalRef.current)
        ringIntervalRef.current = null
    }

    wsRef.current?.send(JSON.stringify({
        type: 'broadcast',
        payload: {
            type: 'callRejected',
            from: identity?.nodeId,
            nickname: username,
            target: incomingCaller,
            timestamp: Date.now()
        }
    }))

    setMessages(prev => [...prev, {
        type: 'system',
        sender: 'System',
        content: `Rejected call from ${incomingCaller}`,
        timestamp: new Date().toLocaleTimeString()
    }])

    setCallType('voice')
    setCallState('idle')
    setIncomingCaller(null)
}

// Hang up
const hangUp = () => {
    if (callState !== 'in_call' && callState !== 'calling') return

    stopAudioCapture()
    setIsTalking(false)

    if (callPartner) {
        wsRef.current?.send(JSON.stringify({
            type: 'broadcast',
            payload: {
                type: 'callEnded',
                from: identity?.nodeId,
                nickname: username,
                target: callPartner,
                timestamp: Date.now()
            }
        }))
    }

    setMessages(prev => [...prev, {
        type: 'system',
        sender: 'System',
        content: 'Call ended',
        timestamp: new Date().toLocaleTimeString()
    }])

    setCallType('voice')
    setCallState('idle')
    setCallPartner(null)
}

// Start talking (push-to-talk)
const startTalking = async () => {
    console.log('[Voice] startTalking called, callState:', callState, 'callPartner:', callPartner)
    if (callState !== 'in_call') {
        console.log('[Voice] Not in call, ignoring')
        return
    }

    if (!mediaStreamRef.current) {
        console.log('[Voice] No media stream, starting capture...')
        const hasAudio = await startAudioCapture()
        if (!hasAudio) {
            console.log('[Voice] Failed to start audio capture')
            return
        }
    }

    console.log('[Voice] Setting isTalking to TRUE')
    setIsTalking(true)

    wsRef.current?.send(JSON.stringify({
        type: 'broadcast',
        payload: {
            type: 'voiceStatus',
            from: identity?.nodeId,
            nickname: username,
            status: 'started',
            target: callPartner,
            timestamp: Date.now()
        }
    }))
}

// Stop talking
const stopTalking = () => {
    if (!isTalking) return

    console.log('[Voice] stopTalking called')
    setIsTalking(false)
    setAudioLevel(0)

    wsRef.current?.send(JSON.stringify({
        type: 'broadcast',
        payload: {
            type: 'voiceStatus',
            from: identity?.nodeId,
            nickname: username,
            status: 'stopped',
            target: callPartner,
            timestamp: Date.now()
        }
    }))
}

// Handle voice payload
const handleVoicePayload = (payload: any) => {
    const senderName = payload.nickname || payload.from?.slice(0, 12) || 'Unknown'
    if (senderName === username) return

    switch (payload.type) {
        case 'callRequest':
            // Check if this call is for us
            if (payload.target === username || payload.target.toLowerCase() === username.toLowerCase()) {
                if (callStateRef.current === 'idle') {
                    setCallType('voice')
                    setIncomingCaller(senderName)
                    setCallState('ringing')

                    // Play ring sound (visual notification)
                    ringIntervalRef.current = setInterval(() => {
                        // Terminal bell sound
                        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleHsYcKjm8tK7egMthNT82suxcCM1jdb/3syrXSEzkt7/3MmgWzEqiNX/3cmfWzYqiNT/3saYWz4pid3/3MWQWEpVi9n/28OLXFRSkNf/2sCIYl1Li9X/27+IY11PjNP/276FY2JOjdH/2ryFZWNPjtD/2rqFZWNPjtD/2rmFZWJQjtD/2rqFZGNPjtH/27uFZWFOjdD/2ruGZmBPjdD/2rqHZl9Qj9D/27qGZl9RjtD/2ryGZl5RkNL/2ryGZl5Rj9H/27qJZlxTkdP/2rqIZlxTkdT/2rmIZltUk9X/2riJZlpVlNX/2reKZlhXldX/2raKZldYldX/27aJZldZltX/2raKZlZalt3/27WKZldaltz/27WLZlVcltr/27SNZVRdl9n/2rOOZVJfl9n/2rGPZVFfl9r/2rCQZVBhmdr/2a+RZE9imdr/2a+RZE5jmtr/2a6TY01kmtr/2a2TY0xkmtr/2ayVYktlm9r/2KuWYkpnm9v/2KqWYkhonNz/2KqXYUdon93/2KmYYUdpnt3/2KiZYEZqnt7/2KeaYEVrn97/16ebX0Rsn97/16acXkNtoN7/16WdXkJuoN7/16SdXUFvoN//16OeXUBwoN//1qKfXD9xod//1qGfXD5yod//1qCgWz5zot//1qChWz10ot//1p+hWjx1o+D/1p6iWjt2pOD/1p2jWTp3pOH/1pykWDl4peH/1pylVzl5peH/1pqmVjh6puL/1pmm');
                        audio.volume = 0.3
                        audio.play().catch(() => { })
                    }, 2000)

                    setMessages(prev => [...prev, {
                        type: 'system',
                        sender: 'System',
                        content: `📞 Incoming call from ${senderName}`,
                        timestamp: new Date().toLocaleTimeString()
                    }])
                } else {
                    // Send busy signal
                    wsRef.current?.send(JSON.stringify({
                        type: 'broadcast',
                        payload: {
                            type: 'callBusy',
                            from: identity?.nodeId,
                            nickname: username,
                            target: senderName,
                            timestamp: Date.now()
                        }
                    }))
                }
            }
            break

        case 'callAccepted':
            if (payload.target === username && callStateRef.current === 'calling') {
                setCallType('voice')
                setCallState('in_call')
                setCallPartner(senderName)
                startAudioCapture()
                setMessages(prev => [...prev, {
                    type: 'system',
                    sender: 'System',
                    content: `Connected with ${senderName}`,
                    timestamp: new Date().toLocaleTimeString()
                }])
            }
            break

        case 'callRejected':
            if (payload.target === username && callStateRef.current === 'calling') {
                setCallType('voice')
                setCallState('idle')
                setCallPartner(null)
                setMessages(prev => [...prev, {
                    type: 'system',
                    sender: 'System',
                    content: `${senderName} declined the call`,
                    timestamp: new Date().toLocaleTimeString()
                }])
            }
            break

        case 'callBusy':
            if (payload.target === username && callStateRef.current === 'calling') {
                setCallType('voice')
                setCallState('idle')
                setCallPartner(null)
                setMessages(prev => [...prev, {
                    type: 'system',
                    sender: 'System',
                    content: `${senderName} is busy`,
                    timestamp: new Date().toLocaleTimeString()
                }])
            }
            break

        case 'callEnded':
            if (payload.target === username && (callStateRef.current === 'in_call' || callStateRef.current === 'ringing')) {
                stopAudioCapture()
                if (ringIntervalRef.current) {
                    clearInterval(ringIntervalRef.current)
                    ringIntervalRef.current = null
                }
                setIsTalking(false)
                setCallType('voice')
                setCallState('idle')
                setCallPartner(null)
                setIncomingCaller(null)
                setMessages(prev => [...prev, {
                    type: 'system',
                    sender: 'System',
                    content: `Call ended by ${senderName}`,
                    timestamp: new Date().toLocaleTimeString()
                }])
            }
            break

        case 'voiceData':
            // Use refs for current values (fixes closure bug)
            const currentPartner = callPartnerRef.current
            const isInCall = callStateRef.current === 'in_call'
            // Case-insensitive comparison for usernames
            const isFromPartner = currentPartner && senderName.toLowerCase() === currentPartner.toLowerCase()

            console.log('[Voice] voiceData received - state:', callStateRef.current, 'from:', senderName, 'partner:', currentPartner, 'isMatch:', isFromPartner)

            if (isInCall && isFromPartner) {
                // Pass the sender's sample rate for proper playback
                playAudio(payload.audio, senderName, payload.sampleRate)
            } else {
                console.log('[Voice] Ignoring voiceData - not in call or wrong sender')
            }
            break

        case 'voiceStatus':
            if (callState === 'in_call' && senderName === callPartner) {
                setMessages(prev => [...prev, {
                    type: 'system',
                    sender: 'System',
                    content: payload.status === 'started' ? `${senderName} is talking...` : `${senderName} stopped`,
                    timestamp: new Date().toLocaleTimeString()
                }])
            }
            break
    }
}

// ============================================
// VIDEO CALL UI + DEVICE HELPERS (Phase 3/6)
// ============================================

const updateVideoSettings = (updates: Partial<VideoSettings>) => {
    setVideoSettings(prev => ({ ...prev, ...updates }))
}

const formatVideoDuration = (elapsedMs: number) => {
    const totalSeconds = Math.floor(elapsedMs / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

const getSignalBars = (quality: number) => {
    if (quality >= 75) return 4
    if (quality >= 50) return 3
    if (quality >= 25) return 2
    return 1
}

const loadVideoDevices = async () => {
    try {
        // Request permission to unlock device labels
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        stream.getTracks().forEach(track => track.stop())

        const devices = await navigator.mediaDevices.enumerateDevices()
        const cameras = devices.filter(d => d.kind === 'videoinput')
        setVideoDevices(cameras)

        if (selectedCameraId !== 'default') {
            const exists = cameras.some(d => d.deviceId === selectedCameraId)
            if (!exists) {
                setSelectedCameraId('default')
            }
        }
    } catch (error) {
        console.error('[Video] Error enumerating cameras:', error)
        try {
            const devices = await navigator.mediaDevices.enumerateDevices()
            const cameras = devices.filter(d => d.kind === 'videoinput')
            setVideoDevices(cameras)
        } catch (secondaryError) {
            console.error('[Video] Cannot enumerate cameras:', secondaryError)
        }
    }
}

const startLocalVideoPreview = async (options?: { withAudio?: boolean; replace?: boolean; startVideoMuted?: boolean; startAudioMuted?: boolean }) => {
    try {
        if (localVideoStream && !options?.replace) {
            setIsVideoPreviewing(true)
            return true
        }

        if (localVideoStream && options?.replace) {
            localVideoStream.getTracks().forEach(track => track.stop())
        }

        const preset = _VIDEO_QUALITY_PRESETS[videoSettings.quality]
        const videoConstraints: MediaTrackConstraints = {
            width: { ideal: preset.width },
            height: { ideal: preset.height },
            frameRate: { ideal: videoSettings.frameRate, max: 30 }
        }

        if (selectedCameraId !== 'default') {
            videoConstraints.deviceId = { exact: selectedCameraId }
        }

        const stream = await navigator.mediaDevices.getUserMedia({
            video: videoConstraints,
            audio: options?.withAudio ? {
                deviceId: selectedMicId !== 'default' ? { exact: selectedMicId } : undefined,
                noiseSuppression: videoSettings.noiseSupression,
                echoCancellation: videoSettings.echoCancellation
            } : false
        })

        if (options?.startVideoMuted) {
            stream.getVideoTracks().forEach(track => {
                track.enabled = false
            })
            setIsCameraOn(false)
        } else {
            setIsCameraOn(true)
        }

        if (options?.startAudioMuted) {
            stream.getAudioTracks().forEach(track => {
                track.enabled = false
            })
            setIsVideoMuted(true)
        } else {
            setIsVideoMuted(false)
        }

        setLocalVideoStream(stream)
        setIsVideoPreviewing(true)
        return true
    } catch (error) {
        console.error('[Video] Camera access denied:', error)
        setMessages(prev => [...prev, {
            type: 'system',
            sender: 'System',
            content: '❌ Camera access denied. Please check permissions.',
            timestamp: new Date().toLocaleTimeString()
        }])
        return false
    }
}

const stopLocalVideoPreview = (options?: { keepCallState?: boolean }) => {
    if (localVideoStream) {
        localVideoStream.getTracks().forEach(track => track.stop())
    }
    setLocalVideoStream(null)
    if (!options?.keepCallState) {
        setIsVideoPreviewing(false)
        setIsCameraOn(false)
        setIsVideoMuted(false)
    }
}

const toggleCamera = async () => {
    if (!localVideoStream) {
        await startLocalVideoPreview()
        return
    }
    const next = !isCameraOn
    localVideoStream.getVideoTracks().forEach(track => {
        track.enabled = next
    })
    setIsCameraOn(next)
}

const toggleVideoMute = () => {
    const next = !isVideoMuted
    if (localVideoStream) {
        localVideoStream.getAudioTracks().forEach(track => {
            track.enabled = !next
        })
    }
    setIsVideoMuted(next)
}

const toggleVideoPreview = async () => {
    if (isVideoPreviewing) {
        stopLocalVideoPreview()
        return
    }
    await startLocalVideoPreview()
}

const makeVideoCall = async (targetNickname: string) => {
    if (callState !== 'idle') {
        setMessages(prev => [...prev, {
            type: 'system',
            sender: 'System',
            content: 'Already in a call. Hang up first.',
            timestamp: new Date().toLocaleTimeString()
        }])
        return
    }

    setCallType('video')
    setCallState('calling')
    setCallPartner(targetNickname)
    setActiveTransportMode(videoSettings.transportMode)

    await startLocalVideoPreview({
        withAudio: true,
        startVideoMuted: videoSettings.muteVideoOnJoin,
        startAudioMuted: videoSettings.muteAudioOnJoin
    })

    wsRef.current?.send(JSON.stringify({
        type: 'broadcast',
        payload: {
            type: 'videoCallRequest',
            from: identity?.nodeId,
            nickname: username,
            target: targetNickname,
            timestamp: Date.now()
        }
    }))

    setMessages(prev => [...prev, {
        type: 'system',
        sender: 'System',
        content: `📹 Video calling ${targetNickname}...`,
        timestamp: new Date().toLocaleTimeString()
    }])

    if (videoCallTimeoutRef.current) {
        clearTimeout(videoCallTimeoutRef.current)
    }
    videoCallTimeoutRef.current = setTimeout(() => {
        if (callStateRef.current === 'calling' && callTypeRef.current === 'video') {
            setCallState('idle')
            setCallPartner(null)
            stopLocalVideoPreview()
            setCallType('voice')
            setMessages(prev => [...prev, {
                type: 'system',
                sender: 'System',
                content: `No answer from ${targetNickname}`,
                timestamp: new Date().toLocaleTimeString()
            }])
        }
    }, 30000)
}

const answerVideoCall = async () => {
    if (callState !== 'ringing' || !incomingCaller) return

    if (ringIntervalRef.current) {
        clearInterval(ringIntervalRef.current)
        ringIntervalRef.current = null
    }

    setCallType('video')
    setCallState('in_call')
    setCallPartner(incomingCaller)
    setIncomingCaller(null)
    setActiveTransportMode(videoSettings.transportMode)

    await startLocalVideoPreview({
        withAudio: true,
        startVideoMuted: videoSettings.muteVideoOnJoin,
        startAudioMuted: videoSettings.muteAudioOnJoin
    })

    wsRef.current?.send(JSON.stringify({
        type: 'broadcast',
        payload: {
            type: 'videoCallAccepted',
            from: identity?.nodeId,
            nickname: username,
            target: incomingCaller,
            timestamp: Date.now()
        }
    }))
}

const rejectVideoCall = () => {
    if (callState !== 'ringing' || !incomingCaller) return

    if (ringIntervalRef.current) {
        clearInterval(ringIntervalRef.current)
        ringIntervalRef.current = null
    }

    wsRef.current?.send(JSON.stringify({
        type: 'broadcast',
        payload: {
            type: 'videoCallRejected',
            from: identity?.nodeId,
            nickname: username,
            target: incomingCaller,
            timestamp: Date.now()
        }
    }))

    setCallState('idle')
    setIncomingCaller(null)
    setCallType('voice')
}

const endVideoCall = () => {
    if (callState !== 'in_call' && callState !== 'calling') return

    if (videoCallTimeoutRef.current) {
        clearTimeout(videoCallTimeoutRef.current)
        videoCallTimeoutRef.current = null
    }

    if (callPartner) {
        wsRef.current?.send(JSON.stringify({
            type: 'broadcast',
            payload: {
                type: 'videoCallEnded',
                from: identity?.nodeId,
                nickname: username,
                target: callPartner,
                timestamp: Date.now()
            }
        }))
    }

    // Close WebRTC peer connection
    if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
        peerConnectionRef.current = null
    }

    stopLocalVideoPreview()
    setRemoteVideoStream(null)
    setConnectionQuality(0)
    setCallState('idle')
    setCallPartner(null)
    setCallType('voice')
}

useEffect(() => {
    if (!selectedCameraId) return
    const shouldRefreshPreview = isVideoPreviewing || (callType === 'video' && callState !== 'idle')
    if (!shouldRefreshPreview) return
    startLocalVideoPreview({
        replace: true,
        withAudio: callType === 'video' && callState !== 'idle',
        startVideoMuted: !isCameraOn,
        startAudioMuted: isVideoMuted
    })
}, [selectedCameraId, videoSettings.quality, videoSettings.frameRate, callType, callState, isVideoPreviewing, isCameraOn, isVideoMuted])

// ============================================
// WEBRTC CONNECTION (Phase 4 - Core WebRTC)
// ============================================

/**
 * Creates a new RTCPeerConnection with proper configuration
 * Sets up event handlers for tracks, ICE candidates, and connection state
 */
const createPeerConnection = (): RTCPeerConnection => {
    // Close existing connection if any
    if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
    }

    const pc = new RTCPeerConnection(RTC_CONFIG)

    // Add local video/audio tracks to the connection
    if (localVideoStream) {
        localVideoStream.getTracks().forEach(track => {
            console.log('[WebRTC] Adding local track:', track.kind)
            pc.addTrack(track, localVideoStream!)
        })
    }

    // Handle incoming remote tracks (video/audio from peer)
    pc.ontrack = (event) => {
        console.log('[WebRTC] Received remote track:', event.track.kind)
        setRemoteVideoStream(event.streams[0])

        // Attach to video element
        if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0]
        }
    }

    // Handle ICE candidates - send to peer via signaling
    pc.onicecandidate = (event) => {
        if (event.candidate && callPartnerRef.current) {
            console.log('[WebRTC] Sending ICE candidate')
            wsRef.current?.send(JSON.stringify({
                type: 'broadcast',
                payload: {
                    type: 'iceCandidate',
                    from: identity?.nodeId,
                    nickname: username,
                    target: callPartnerRef.current,
                    candidate: event.candidate.toJSON(),
                    timestamp: Date.now()
                }
            }))
        }
    }

    // Monitor connection state for quality and failures
    pc.onconnectionstatechange = () => {
        console.log('[WebRTC] Connection state:', pc.connectionState)

        switch (pc.connectionState) {
            case 'connected':
                setConnectionQuality(100)
                setMessages(prev => [...prev, {
                    type: 'system',
                    sender: 'System',
                    content: '✅ Video connection established',
                    timestamp: new Date().toLocaleTimeString()
                }])
                break
            case 'disconnected':
                setConnectionQuality(25)
                setMessages(prev => [...prev, {
                    type: 'system',
                    sender: 'System',
                    content: '⚠️ Video connection unstable',
                    timestamp: new Date().toLocaleTimeString()
                }])
                break
            case 'failed':
                setConnectionQuality(0)
                endVideoCall()
                setMessages(prev => [...prev, {
                    type: 'system',
                    sender: 'System',
                    content: '❌ Video connection failed',
                    timestamp: new Date().toLocaleTimeString()
                }])
                break
        }
    }

    // Monitor ICE connection state
    pc.oniceconnectionstatechange = () => {
        console.log('[WebRTC] ICE connection state:', pc.iceConnectionState)

        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
            setConnectionQuality(100)
        } else if (pc.iceConnectionState === 'checking') {
            setConnectionQuality(50)
        }
    }

    peerConnectionRef.current = pc
    return pc
}

/**
 * Initiates WebRTC connection as the caller (creates and sends offer)
 */
const initiateWebRTCConnection = async () => {
    try {
        // Select transport mode based on settings
        const transport = selectTransportMode()
        setActiveTransportMode(transport)
        console.log(`[WebRTC] Initiating connection as caller (transport: ${transport})`)

        const pc = createPeerConnection()

        // Create SDP offer
        const offer = await pc.createOffer({
            offerToReceiveVideo: true,
            offerToReceiveAudio: true
        })

        await pc.setLocalDescription(offer)
        console.log('[WebRTC] Created and set local offer')

        // Send offer to peer via signaling
        if (callPartnerRef.current) {
            wsRef.current?.send(JSON.stringify({
                type: 'broadcast',
                payload: {
                    type: 'videoOffer',
                    from: identity?.nodeId,
                    nickname: username,
                    target: callPartnerRef.current,
                    sdp: offer,
                    transport: transport, // Include transport mode in signaling
                    timestamp: Date.now()
                }
            }))
        }
    } catch (error) {
        console.error('[WebRTC] Failed to initiate connection:', error)
        setMessages(prev => [...prev, {
            type: 'system',
            sender: 'System',
            content: '❌ Failed to start video connection',
            timestamp: new Date().toLocaleTimeString()
        }])
    }
}

/**
 * Handles incoming SDP offer from peer (creates and sends answer)
 */
const handleRemoteOffer = async (sdp: RTCSessionDescriptionInit, senderName: string, transport?: TransportMode) => {
    try {
        // Set transport mode from caller's offer or use our settings
        const activeTransport = transport || selectTransportMode()
        setActiveTransportMode(activeTransport)
        console.log(`[WebRTC] Handling remote offer from: ${senderName} (transport: ${activeTransport})`)

        const pc = createPeerConnection()

        // Set the remote offer
        await pc.setRemoteDescription(new RTCSessionDescription(sdp))
        console.log('[WebRTC] Set remote description (offer)')

        // Create and set answer
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        console.log('[WebRTC] Created and set local answer')

        // Send answer back to caller
        wsRef.current?.send(JSON.stringify({
            type: 'broadcast',
            payload: {
                type: 'videoAnswer',
                from: identity?.nodeId,
                nickname: username,
                target: senderName,
                sdp: answer,
                transport: activeTransport,
                timestamp: Date.now()
            }
        }))
    } catch (error) {
        console.error('[WebRTC] Failed to handle offer:', error)
        setMessages(prev => [...prev, {
            type: 'system',
            sender: 'System',
            content: '❌ Failed to accept video connection',
            timestamp: new Date().toLocaleTimeString()
        }])
    }
}

/**
 * Handles incoming SDP answer from peer
 */
const handleRemoteAnswer = async (sdp: RTCSessionDescriptionInit) => {
    try {
        console.log('[WebRTC] Handling remote answer')
        if (peerConnectionRef.current) {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(sdp))
            console.log('[WebRTC] Set remote description (answer)')
        }
    } catch (error) {
        console.error('[WebRTC] Failed to handle answer:', error)
    }
}

/**
 * Adds an ICE candidate received from peer
 */
const addIceCandidate = async (candidate: RTCIceCandidateInit) => {
    try {
        if (peerConnectionRef.current && candidate) {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate))
            console.log('[WebRTC] Added ICE candidate')
        }
    } catch (error) {
        console.error('[WebRTC] Failed to add ICE candidate:', error)
    }
}

/**
 * Closes the peer connection and cleans up
 */
const closePeerConnection = () => {
    if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
        peerConnectionRef.current = null
        console.log('[WebRTC] Peer connection closed')
    }
    setRemoteVideoStream(null)
    setConnectionQuality(0)
}

// ============================================
// TRANSPORT MODE SUPPORT (Phase 4B - Hybrid)
// ============================================

/**
 * Determines the transport path to use based on settings
 * For v1.0, we use WebRTC only (blockchain relay is placeholder for v1.5)
 */
const selectTransportMode = (): TransportMode => {
    const preferred = videoSettings.transportMode

    // For now, WebRTC is the only implemented path
    // Blockchain relay will be added in v1.5
    if (preferred === 'blockchain') {
        console.log('[Transport] Blockchain relay not yet implemented, using WebRTC')
        return 'webrtc'
    }

    if (preferred === 'hybrid') {
        // Hybrid mode: start with WebRTC, fallback if needed
        console.log('[Transport] Hybrid mode: starting with WebRTC')
        return 'webrtc'
    }

    return 'webrtc'
}

/**
 * Monitors connection quality and triggers fallback if needed
 * Called periodically during active video calls
 */
const checkConnectionQuality = () => {
    if (!peerConnectionRef.current) return 100

    const pc = peerConnectionRef.current

    // Check ICE connection state for quality indicator
    switch (pc.iceConnectionState) {
        case 'connected':
        case 'completed':
            return 100
        case 'checking':
            return 50
        case 'disconnected':
            return 25
        case 'failed':
        case 'closed':
            return 0
        default:
            return 75
    }
}

/**
 * Attempts to recover a degraded connection
 * In hybrid mode, could trigger fallback to blockchain relay
 */
const attemptConnectionRecovery = async () => {
    console.log('[Transport] Attempting connection recovery')

    // Check if we should fallback (hybrid mode only)
    if (videoSettings.transportMode === 'hybrid' && activeTransportMode === 'webrtc') {
        const quality = checkConnectionQuality()

        if (quality < 25) {
            console.log('[Transport] Connection quality poor, would fallback to blockchain relay')
            // TODO v1.5: Implement blockchain relay fallback
            // setActiveTransportMode('blockchain')
            // initiateBlockchainRelay()

            // For now, just try to restart ICE
            if (peerConnectionRef.current) {
                try {
                    peerConnectionRef.current.restartIce()
                    console.log('[Transport] ICE restart requested')
                } catch (error) {
                    console.error('[Transport] ICE restart failed:', error)
                }
            }
        }
    }
}

/**
 * Updates connection quality metric based on WebRTC stats
 */
const updateConnectionQuality = async () => {
    if (!peerConnectionRef.current || callState !== 'in_call' || callType !== 'video') return

    try {
        const stats = await peerConnectionRef.current.getStats()
        let packetsLost = 0
        let packetsReceived = 0
        let roundTripTime = 0

        stats.forEach(report => {
            if (report.type === 'inbound-rtp' && report.kind === 'video') {
                packetsLost = report.packetsLost || 0
                packetsReceived = report.packetsReceived || 0
            }
            if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                roundTripTime = report.currentRoundTripTime || 0
            }
        })

        // Calculate quality score (0-100)
        const totalPackets = packetsReceived + packetsLost
        const lossRatio = totalPackets > 0 ? packetsLost / totalPackets : 0
        const latencyPenalty = Math.min(roundTripTime * 100, 30) // Max 30% penalty for latency

        let quality = 100 - (lossRatio * 50) - latencyPenalty
        quality = Math.max(0, Math.min(100, quality))

        setConnectionQuality(Math.round(quality))

        // Log for debugging
        if (quality < 75) {
            console.log(`[Transport] Quality: ${Math.round(quality)}% (loss: ${(lossRatio * 100).toFixed(1)}%, RTT: ${(roundTripTime * 1000).toFixed(0)}ms)`)
        }

        // Trigger recovery if quality is very poor
        if (quality < 25) {
            attemptConnectionRecovery()
        }
    } catch (error) {
        // Stats not available, use ICE state as fallback
        setConnectionQuality(checkConnectionQuality())
    }
}

// Quality monitoring interval during video calls
useEffect(() => {
    if (callState !== 'in_call' || callType !== 'video') return

    const interval = setInterval(updateConnectionQuality, 3000)
    return () => clearInterval(interval)
}, [callState, callType])

// ============================================
// VIDEO CALL SIGNALING (Phase 2 - Protocol)
// ============================================

/**
 * Handle incoming video call signaling messages
 * Message types: videoCallRequest, videoCallAccepted, videoCallRejected,
 *                videoCallEnded, videoOffer, videoAnswer, iceCandidate
 */
const handleVideoPayload = (payload: any) => {
    const senderName = payload.nickname || payload.from?.slice(0, 12) || 'Unknown'
    if (senderName === username) return

    console.log('[Video] Received payload:', payload.type, 'from:', senderName)

    switch (payload.type) {
        case 'videoCallRequest':
            // Check if this call is for us
            if (payload.target === username || payload.target.toLowerCase() === username.toLowerCase()) {
                if (callStateRef.current === 'idle') {
                    setCallType('video')
                    setIncomingCaller(senderName)
                    setCallState('ringing')

                    // Play ring sound (reuse voice call ring logic)
                    ringIntervalRef.current = setInterval(() => {
                        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleHsYcKjm8tK7egMthNT82suxcCM1jdb/3syrXSEzkt7/3MmgWzEqiNX/3cmfWzYqiNT/3saYWz4pid3/3MWQWEpVi9n/28OLXFRSkNf/2sCIYl1Li9X/27+IY11PjNP/276FY2JOjdH/2ryFZWNPjtD/2rqFZWNPjtD/2rmFZWJQjtD/2rqFZGNPjtH/27uFZWFOjdD/2ruGZmBPjdD/2rqHZl9Qj9D/27qGZl9RjtD/2ryGZl5RkNL/2ryGZl5Rj9H/27qJZlxTkdP/2rqIZlxTkdT/2rmIZltUk9X/2riJZlpVlNX/2reKZlhXldX/2raKZldYldX/27aJZldZltX/2raKZlZalt3/27WKZldaltz/27WLZlVcltr/27SNZVRdl9n/2rOOZVJfl9n/2rGPZVFfl9r/2rCQZVBhmdr/2a+RZE9imdr/2a+RZE5jmtr/2a6TY01kmtr/2a2TY0xkmtr/2ayVYktlm9r/2KuWYkpnm9v/2KqWYkhonNz/2KqXYUdon93/2KmYYUdpnt3/2KiZYEZqnt7/2KeaYEVrn97/16ebX0Rsn97/16acXkNtoN7/16WdXkJuoN7/16SdXUFvoN//16OeXUBwoN//1qKfXD9xod//1qGfXD5yod//1qCgWz5zot//1qChWz10ot//1p+hWjx1o+D/1p6iWjt2pOD/1p2jWTp3pOH/1pykWDl4peH/1pylVzl5peH/1pqmVjh6puL/1pmm');
                        audio.volume = 0.3
                        audio.play().catch(() => { })
                    }, 2000)

                    setMessages(prev => [...prev, {
                        type: 'system',
                        sender: 'System',
                        content: `📹 Incoming VIDEO call from ${senderName}`,
                        timestamp: new Date().toLocaleTimeString()
                    }])
                } else {
                    // Send busy signal
                    wsRef.current?.send(JSON.stringify({
                        type: 'broadcast',
                        payload: {
                            type: 'videoCallBusy',
                            from: identity?.nodeId,
                            nickname: username,
                            target: senderName,
                            timestamp: Date.now()
                        }
                    }))
                }
            }
            break

        case 'videoCallAccepted':
            if (payload.target === username && callStateRef.current === 'calling') {
                setCallType('video')
                setCallState('in_call')
                setCallPartner(senderName)

                // Phase 4: Initiate WebRTC connection as the caller
                initiateWebRTCConnection()

                setMessages(prev => [...prev, {
                    type: 'system',
                    sender: 'System',
                    content: `📹 Video call connected with ${senderName}`,
                    timestamp: new Date().toLocaleTimeString()
                }])
            }
            break

        case 'videoCallRejected':
            if (payload.target === username && callStateRef.current === 'calling') {
                setCallType('voice')
                setCallState('idle')
                setCallPartner(null)
                setMessages(prev => [...prev, {
                    type: 'system',
                    sender: 'System',
                    content: `${senderName} declined the video call`,
                    timestamp: new Date().toLocaleTimeString()
                }])
            }
            break

        case 'videoCallBusy':
            if (payload.target === username && callStateRef.current === 'calling') {
                setCallType('voice')
                setCallState('idle')
                setCallPartner(null)
                setMessages(prev => [...prev, {
                    type: 'system',
                    sender: 'System',
                    content: `${senderName} is busy (video)`,
                    timestamp: new Date().toLocaleTimeString()
                }])
            }
            break

        case 'videoCallEnded':
            if (payload.target === username && (callStateRef.current === 'in_call' || callStateRef.current === 'ringing')) {
                // Phase 4: Close WebRTC connection
                closePeerConnection()

                if (ringIntervalRef.current) {
                    clearInterval(ringIntervalRef.current)
                    ringIntervalRef.current = null
                }
                stopLocalVideoPreview()
                setCallType('voice')
                setCallState('idle')
                setCallPartner(null)
                setIncomingCaller(null)
                setMessages(prev => [...prev, {
                    type: 'system',
                    sender: 'System',
                    content: `Video call ended by ${senderName}`,
                    timestamp: new Date().toLocaleTimeString()
                }])
            }
            break

        // WebRTC Signaling messages (Phase 4)
        case 'videoOffer':
            if (payload.target === username && payload.sdp) {
                console.log('[Video] Received SDP offer from:', senderName)
                // Handle incoming offer and send answer (pass transport mode from caller)
                handleRemoteOffer(payload.sdp, senderName, payload.transport)
            }
            break

        case 'videoAnswer':
            if (payload.target === username && payload.sdp) {
                console.log('[Video] Received SDP answer from:', senderName)
                // Set remote description with the answer
                handleRemoteAnswer(payload.sdp)
            }
            break

        case 'iceCandidate':
            if (payload.target === username && payload.candidate) {
                console.log('[Video] Received ICE candidate from:', senderName)
                // Add ICE candidate to peer connection
                addIceCandidate(payload.candidate)
            }
            break
    }
}

// Settings functions
const openSettings = async () => {
    try {
        if (window.electronAPI) {
            const paths = await window.electronAPI.identity.getPaths()
            setStoragePaths(paths)
            const exported = await window.electronAPI.identity.export()
            setIdentityExport(exported)
        }
        // Load available audio devices when settings opens
        loadAudioDevices()
        loadVideoDevices()
    } catch (error) {
        console.error('Error loading settings:', error)
    }
    setView('settings')
}

const updateDisplayName = async () => {
    if (!username.trim()) return
    try {
        if (window.electronAPI) {
            const updated = await window.electronAPI.identity.updateUsername(username)
            if (updated) setIdentity(updated)
        }
    } catch (error) {
        console.error('Error updating username:', error)
    }
}

// Loading screen
if (loading) {
    return (
        <div className={`ranger-chat-container theme-${theme}`}>
            <div className="loading-screen">
                <div className="loading-spinner">🦅</div>
                <p>Loading...</p>
            </div>
        </div>
    )
}

return (
    <div className={`ranger-chat-container theme-${theme}`}>
        {/* UPDATE BANNER - Shows on all views if notifications enabled */}
        {updateAvailable && showUpdateBanner && updateNotificationsEnabled && (
            <div className="update-banner">
                <div className="update-content">
                    <span className="update-icon">🚀</span>
                    <span className="update-text">
                        <strong>Update Available!</strong> v{latestVersion} is ready.
                    </span>
                    <span className="update-command">
                        Run: <code>git pull</code> then <code>npm run dev</code>
                    </span>
                </div>
                <button className="update-dismiss" onClick={() => setShowUpdateBanner(false)}>
                    ✕
                </button>
            </div>
        )}

        {/* LOGIN VIEW */}
        {view === 'login' && (
            <div className="login-screen">
                <div className="login-card">
                    <div className="logo">
                        {loginPicture === 'default' ? (
                            '🦅'
                        ) : loginPicture === 'rangersmyth' ? (
                            <img src="./rangersmyth-pic.png" alt="RangerSmyth" className="login-logo-image" />
                        ) : (
                            <img src={loginPicture} alt="Custom" className="login-logo-image" />
                        )}
                    </div>
                    <h1>RangerChat</h1>
                    <p className="subtitle">Lite Edition v{APP_VERSION}</p>

                    <div className="input-group">
                        <label>Choose Your Name</label>
                        <div className="username-input-row">
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter a display name..."
                                className={isGenerating ? 'generating' : ''}
                            />
                            <button
                                className="random-btn"
                                onClick={generateRandomUsername}
                                title="Generate random name"
                            >
                                🎲
                            </button>
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Server</label>
                        <input
                            type="text"
                            value={serverUrl}
                            onChange={(e) => setServerUrl(e.target.value)}
                            placeholder="ws://..."
                        />
                    </div>

                    <button className="connect-btn" onClick={connect} disabled={!username.trim()}>
                        Connect
                    </button>
                </div>
            </div>
        )}

        {/* CHAT VIEW */}
        {view === 'chat' && (
            <div className={`chat-interface ${radioSettings.chatScreensaverEnabled ? 'screensaver-active' : ''}`}>
                {/* Chat Screensaver Background */}
                <ScreensaverBackground
                    enabled={radioSettings.chatScreensaverEnabled ?? false}
                    mode={radioSettings.chatScreensaverMode ?? 'matrix'}
                    opacity={radioSettings.chatScreensaverOpacity ?? 30}
                    interval={radioSettings.chatScreensaverInterval ?? 10}
                    transition={radioSettings.chatScreensaverTransition ?? 'fade'}
                    matrixOnIdle={radioSettings.chatScreensaverMatrixOnIdle ?? false}
                    idleTimeout={radioSettings.chatScreensaverIdleTimeout ?? 120}
                    showClock={radioSettings.chatScreensaverShowClock ?? false}
                    theme={theme}
                    matrixDensity={radioSettings.chatMatrixDensity ?? 3}
                    matrixSpeed={radioSettings.chatMatrixSpeed ?? 3}
                    matrixBrightness={radioSettings.chatMatrixBrightness ?? 4}
                    matrixTrailLength={radioSettings.chatMatrixTrailLength ?? 3}
                />
                <div className="chat-header">
                    <div className="header-left">
                        <span className="header-icon">🦅</span>
                        <span className="header-title">RangerChat</span>
                    </div>
                    <div className="header-right">
                        {/* Voice Call Button */}
                        <button
                            className={`header-btn call-btn ${callType === 'voice' && callState !== 'idle' ? 'active' : ''}`}
                            onClick={() => setShowPeerList(!showPeerList)}
                            title={
                                callState === 'idle'
                                    ? 'Start voice call'
                                    : callType === 'voice' && callState === 'in_call'
                                        ? `In call with ${callPartner}`
                                        : callType === 'voice'
                                            ? 'Calling...'
                                            : 'Start voice call'
                            }
                            disabled={callState === 'ringing'}
                        >
                            {callType === 'voice' && callState === 'in_call' ? '🔊' : callType === 'voice' && callState === 'calling' ? '📱' : '📞'}
                        </button>
                        {/* Video Call Button */}
                        <button
                            className={`header-btn video-btn ${callType === 'video' && callState !== 'idle' ? 'active' : ''}`}
                            onClick={() => setShowPeerList(!showPeerList)}
                            title={
                                callState === 'idle'
                                    ? 'Start video call'
                                    : callType === 'video' && callState === 'in_call'
                                        ? `Video call with ${callPartner}`
                                        : callType === 'video'
                                            ? 'Video calling...'
                                            : 'Start video call'
                            }
                            disabled={callState === 'ringing'}
                        >
                            {callType === 'video' && callState !== 'idle' ? '📹' : '🎥'}
                        </button>
                        <button
                            className={`header-btn ${showSearch ? 'active' : ''}`}
                            onClick={() => setShowSearch(!showSearch)}
                            title="Search messages"
                        >
                            🔍
                        </button>
                        <button
                            className={`header-btn ${showSlashHelp ? 'active' : ''}`}
                            onClick={() => setShowSlashHelp(!showSlashHelp)}
                            title="Slash commands"
                        >
                            ?
                        </button>
                        <button
                            className={`header-btn ${radioSettings.radioEnabled ? 'active' : ''}`}
                            onClick={() => handleRadioSettingsChange({ radioEnabled: !radioSettings.radioEnabled, radioMinimized: false })}
                            title={radioSettings.radioEnabled ? 'Close Radio' : 'Open Radio'}
                        >
                            📻
                        </button>
                        <button
                            className="header-btn"
                            onClick={cycleTheme}
                            title={`Theme: ${THEMES[theme].name} (click to change)`}
                        >
                            {THEMES[theme].icon}
                        </button>
                        <button
                            className="header-btn"
                            onClick={() => { loadLedgerData(); setView('ledger') }}
                            title="Blockchain Ledger"
                        >
                            ⛓️
                        </button>
                        <button
                            className="header-btn"
                            onClick={openSettings}
                            title="Settings"
                        >
                            ⚙️
                        </button>
                    </div>
                </div>

                {showSearch && (
                    <div className="search-bar">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search messages..."
                            autoFocus
                        />
                        {searchQuery && (
                            <span className="search-count">
                                {getFilteredMessages().length} found
                            </span>
                        )}
                        <button onClick={() => { setSearchQuery(''); setShowSearch(false); }}>✕</button>
                    </div>
                )}

                {/* Incoming Call Banner */}
                {callState === 'ringing' && incomingCaller && callType === 'voice' && (
                    <div className="incoming-call-banner">
                        <div className="call-info">
                            <span className="call-icon ringing">📞</span>
                            <span className="caller-name">{incomingCaller}</span>
                            <span className="call-status">is calling...</span>
                        </div>
                        <div className="call-actions">
                            <button className="call-answer-btn" onClick={answerCall} aria-label="Answer voice call">
                                ✓ Answer
                            </button>
                            <button className="call-reject-btn" onClick={rejectCall} aria-label="Reject voice call">
                                ✕ Reject
                            </button>
                        </div>
                    </div>
                )}

                {callState === 'ringing' && incomingCaller && callType === 'video' && (
                    <div className="incoming-video-banner">
                        <div className="call-info">
                            <span className="call-icon ringing">📹</span>
                            <span className="caller-name">{incomingCaller}</span>
                            <span className="call-status">is video calling...</span>
                        </div>
                        <div className="call-actions">
                            <button className="call-answer-btn" onClick={answerVideoCall} aria-label="Answer video call">
                                ✓ Answer
                            </button>
                            <button className="call-reject-btn" onClick={rejectVideoCall} aria-label="Reject video call">
                                ✕ Reject
                            </button>
                        </div>
                    </div>
                )}

                {/* In-Call Control Bar */}
                {callState === 'in_call' && callType === 'voice' && (
                    <div className="in-call-bar">
                        <div className="call-info">
                            <span className="call-icon connected">🔊</span>
                            <span className="call-partner">{callPartner}</span>
                            {isTalking && (
                                <div className="audio-meter">
                                    <div
                                        className="audio-level"
                                        style={{ width: `${audioLevel}%` }}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="call-controls">
                            <button
                                className={`talk-btn ${isTalking ? 'talking' : ''}`}
                                onMouseDown={startTalking}
                                onMouseUp={stopTalking}
                                onMouseLeave={stopTalking}
                                onTouchStart={startTalking}
                                onTouchEnd={stopTalking}
                            >
                                {isTalking ? '🎤 Talking...' : '🎤 Push to Talk'}
                            </button>
                            <button
                                className={`mute-btn ${isMuted ? 'muted' : ''}`}
                                onClick={() => setIsMuted(!isMuted)}
                                title={isMuted ? 'Unmute' : 'Mute'}
                            >
                                {isMuted ? '🔇' : '🔊'}
                            </button>
                            <button className="hangup-btn" onClick={hangUp}>
                                📵 Hang Up
                            </button>
                        </div>
                    </div>
                )}

                {/* Calling Status Bar */}
                {callState === 'calling' && callType === 'voice' && (
                    <div className="calling-bar">
                        <div className="call-info">
                            <span className="call-icon calling">📱</span>
                            <span className="call-partner">
                                Calling {callPartner}
                                <span className="call-dots">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </span>
                            </span>
                        </div>
                        <button className="cancel-call-btn" onClick={hangUp}>
                            ✕ Cancel
                        </button>
                    </div>
                )}

                {callType === 'video' && (callState === 'calling' || callState === 'in_call') && (
                    <div
                        className={`video-call-overlay ${videoSettings.highContrastControls ? 'high-contrast' : ''} ${videoSettings.largeControlButtons ? 'large-controls' : ''}`}
                        aria-live={videoSettings.screenReaderAnnouncements ? 'polite' : undefined}
                    >
                        <div className="video-call-header">
                            <div className="video-call-title">
                                <span className="video-call-icon">📹</span>
                                <span className="video-call-name">
                                    {callPartner || incomingCaller || 'Video Call'}
                                </span>
                                <span className={`video-call-state ${callState}`}>
                                    {callState === 'calling' ? 'Calling...' : 'Live'}
                                </span>
                            </div>
                            <div className="video-call-meta">
                                <div className="video-call-timer" aria-label="Call duration">
                                    {formatVideoDuration(videoCallElapsed)}
                                </div>
                                <div className={`video-transport-pill transport-${activeTransportMode}`}>
                                    {activeTransportMode === 'webrtc' ? 'WebRTC' : activeTransportMode === 'blockchain' ? 'Blockchain' : 'Hybrid'}
                                </div>
                                <div className="video-signal" aria-label={`Connection quality ${connectionQuality}%`}>
                                    {[1, 2, 3, 4].map(level => (
                                        <span
                                            key={level}
                                            className={`signal-bar ${getSignalBars(connectionQuality) >= level ? 'active' : ''}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="video-call-stage">
                            <div className="remote-video-frame">
                                {remoteVideoStream ? (
                                    <video
                                        ref={remoteVideoRef}
                                        autoPlay
                                        playsInline
                                        className="remote-video"
                                    />
                                ) : (
                                    <div className="video-placeholder">
                                        <div className="placeholder-avatar">
                                            {(callPartner || incomingCaller || '?').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="placeholder-text">
                                            {callState === 'calling' ? 'Waiting for answer...' : 'Connecting video...'}
                                        </div>
                                    </div>
                                )}

                                <div className={`local-video-pip ${videoSettings.mirrorLocal ? 'mirrored' : ''}`}>
                                    {localVideoStream ? (
                                        <video
                                            ref={localVideoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            className="local-video"
                                        />
                                    ) : (
                                        <div className="pip-placeholder">
                                            <span>Camera off</span>
                                        </div>
                                    )}
                                    {!isCameraOn && <div className="camera-off-overlay">Camera Off</div>}
                                </div>
                            </div>
                        </div>

                        <div className="video-call-controls" role="group" aria-label="Video call controls">
                            <button
                                className={`video-control-btn ${isVideoMuted ? 'active' : ''}`}
                                onClick={toggleVideoMute}
                                aria-label={isVideoMuted ? 'Unmute microphone' : 'Mute microphone'}
                            >
                                {isVideoMuted ? '🔇' : '🎤'}
                                <span>{isVideoMuted ? 'Unmute' : 'Mute'}</span>
                            </button>
                            <button
                                className={`video-control-btn ${!isCameraOn ? 'active' : ''}`}
                                onClick={toggleCamera}
                                aria-label={isCameraOn ? 'Turn camera off' : 'Turn camera on'}
                            >
                                {isCameraOn ? '📹' : '📷'}
                                <span>{isCameraOn ? 'Cam On' : 'Cam Off'}</span>
                            </button>
                            <button
                                className="video-control-btn"
                                onClick={() => updateVideoSettings({ mirrorLocal: !videoSettings.mirrorLocal })}
                                aria-label="Flip local video"
                            >
                                🔄
                                <span>Flip</span>
                            </button>
                            <button
                                className="video-control-btn end-call"
                                onClick={endVideoCall}
                                aria-label="End video call"
                            >
                                📵
                                <span>End</span>
                            </button>
                        </div>
                    </div>
                )}

                <div className="chat-history" ref={chatHistoryRef}>
                    {getFilteredMessages().map((msg, i) => (
                        <div key={i} className={`message ${msg.type} ${msg.sender === username ? 'own' : ''}`}>
                            <div className="message-meta">
                                <span className="sender">
                                    {msg.sender === username && adminStatus?.isSupreme && <span className="msg-admin-badge">👑</span>}
                                    {msg.sender}
                                </span>
                                <span className="timestamp">{msg.timestamp}</span>
                                {/* Quick call buttons for other users' messages */}
                                {msg.type === 'chat' && msg.sender !== username && msg.sender !== 'System' && (
                                    <>
                                        <button
                                            className="msg-call-btn"
                                            onClick={() => makeCall(msg.sender)}
                                            title={`Voice call ${msg.sender}`}
                                        >
                                            📞
                                        </button>
                                        <button
                                            className="msg-video-btn"
                                            onClick={() => makeVideoCall(msg.sender)}
                                            title={`Video call ${msg.sender}`}
                                        >
                                            📹
                                        </button>
                                    </>
                                )}
                            </div>
                            <div className="message-content">{msg.content}</div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {showEmojiPicker && (
                    <div className="emoji-picker">
                        <div className="emoji-header">
                            <input
                                type="text"
                                value={emojiSearch}
                                onChange={(e) => setEmojiSearch(e.target.value)}
                                placeholder="Search emojis..."
                                className="emoji-search"
                            />
                            <button className="emoji-close" onClick={() => setShowEmojiPicker(false)}>✕</button>
                        </div>
                        <div className="emoji-categories">
                            {(Object.keys(EMOJI_DATA) as (keyof typeof EMOJI_DATA)[]).map(cat => (
                                <button
                                    key={cat}
                                    className={`cat-btn ${emojiCategory === cat ? 'active' : ''}`}
                                    onClick={() => { setEmojiCategory(cat); setEmojiSearch(''); }}
                                >
                                    {EMOJI_DATA[cat][0]}
                                </button>
                            ))}
                        </div>
                        <div className="emoji-grid">
                            {getFilteredEmojis().map((emoji, i) => (
                                <button
                                    key={i}
                                    className="emoji-btn"
                                    onClick={() => insertEmoji(emoji)}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Radio Player - Above chat input */}
                {radioSettings.radioEnabled && (
                    <RadioPlayer
                        settings={radioSettings}
                        onSettingsChange={handleRadioSettingsChange}
                        theme={theme}
                    />
                )}

                <div className="chat-input-area">
                    <button
                        className={`emoji-toggle ${showEmojiPicker ? 'active' : ''}`}
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                        😀
                    </button>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type a message..."
                        className="message-input"
                    />
                    <button className="send-btn" onClick={sendMessage}>
                        Send
                    </button>
                </div>

                {/* Call Modal */}
                {showPeerList && callState === 'idle' && (
                    <div className="call-modal-overlay" onClick={() => setShowPeerList(false)}>
                        <div className="call-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="call-modal-header">
                                <div className="call-modal-title">
                                    <span className="call-icon">📱</span>
                                    <span>Call</span>
                                </div>
                                <button className="call-modal-close" onClick={() => setShowPeerList(false)}>
                                    ✕
                                </button>
                            </div>
                            <div className="call-modal-body">
                                {peers.length === 0 ? (
                                    <div className="peer-list-empty">
                                        <div className="empty-icon">📡</div>
                                        <div className="empty-text">Waiting for Rangers...</div>
                                        <div className="empty-hint">No other users are online yet. Share the app with a friend!</div>
                                    </div>
                                ) : (
                                    peers.map((peer, i) => (
                                        <div key={i} className="peer-list-item">
                                            <div className="peer-avatar" style={{
                                                background: `linear-gradient(135deg, ${['#5c6bc0', '#26a69a', '#ef5350', '#ab47bc', '#ffa726'][i % 5]
                                                    } 0%, ${['#3949ab', '#00897b', '#c62828', '#7b1fa2', '#f57c00'][i % 5]
                                                    } 100%)`
                                            }}>
                                                {peer.nickname?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            <div className="peer-info">
                                                <div className="peer-name">{peer.nickname || 'Unknown'}</div>
                                                <div className="peer-status">
                                                    <span className="online-dot"></span>
                                                    Online{peer.capabilities?.includes('voice') && ' • Voice Ready'}
                                                </div>
                                            </div>
                                            <div className="peer-call-actions">
                                                <button
                                                    className="peer-call-btn"
                                                    onClick={() => {
                                                        makeCall(peer.nickname)
                                                        setShowPeerList(false)
                                                    }}
                                                    aria-label={`Start voice call with ${peer.nickname}`}
                                                >
                                                    📞 Call
                                                </button>
                                                <button
                                                    className="peer-video-btn"
                                                    onClick={() => {
                                                        makeVideoCall(peer.nickname)
                                                        setShowPeerList(false)
                                                    }}
                                                    aria-label={`Start video call with ${peer.nickname}`}
                                                >
                                                    📹 Video
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="call-modal-footer">
                                <div className="call-modal-tip">
                                    💡 Tip: Type <code>/call username</code> for voice or <code>/video username</code> for video
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Slash Commands Help */}
                {showSlashHelp && (
                    <div className="slash-help-overlay" onClick={() => setShowSlashHelp(false)}>
                        <div className="slash-help-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="slash-help-header">
                                <span>Slash Commands</span>
                                <button className="slash-help-close" onClick={() => setShowSlashHelp(false)}>
                                    ✕
                                </button>
                            </div>
                            <div className="slash-help-body">
                                <div className="slash-help-item">
                                    <code>/call username</code>
                                    <span>Start a 1-to-1 voice call.</span>
                                </div>
                                <div className="slash-help-item">
                                    <code>/video username</code>
                                    <span>Start a 1-to-1 video call.</span>
                                </div>
                                <div className="slash-help-item">
                                    <code>/hangup</code> <span>or</span> <code>/end</code>
                                    <span>Hang up the current call.</span>
                                </div>
                                <div className="slash-help-item">
                                    <code>/peers</code> <span>or</span> <code>/online</code>
                                    <span>List online users with voice capability.</span>
                                </div>
                                <div className="slash-help-item">
                                    <code>/weather</code>
                                    <span>Local weather (auto-detect) or /weather Dublin.</span>
                                </div>
                                <div className="slash-help-item">
                                    <code>/update</code>
                                    <span>Check for and install app updates.</span>
                                </div>
                                <div className="slash-help-item">
                                    <code>/version</code>
                                    <span>Show current and latest version.</span>
                                </div>
                                <div className="slash-help-note">Commands are case-insensitive.</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* SETTINGS VIEW */}
        {view === 'settings' && (
            <div className="settings-screen">
                <div className="settings-header">
                    <button className="back-btn" onClick={() => setView(connected ? 'chat' : 'login')}>
                        ← Back
                    </button>
                    <h2>Settings</h2>
                </div>

                <div className="settings-content">
                    {/* Profile Section */}
                    <div className="settings-section">
                        <h3>👤 Profile</h3>
                        <div className="setting-item">
                            <label>Display Name</label>
                            <div className="username-input-row">
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                                <button className="random-btn" onClick={generateRandomUsername}>🎲</button>
                            </div>
                            <button className="save-btn" onClick={updateDisplayName}>
                                Save Name
                            </button>
                        </div>
                    </div>

                    {/* Microphone Settings Section */}
                    <div className="settings-section">
                        <h3>🎤 Microphone Settings</h3>
                        <p className="settings-note">Select which microphone to use for voice calls</p>
                        <div className="mic-settings">
                            <select
                                className="mic-select"
                                value={selectedMicId}
                                onChange={(e) => setSelectedMicId(e.target.value)}
                            >
                                <option value="default">System Default</option>
                                {audioDevices.map((device) => (
                                    <option key={device.deviceId} value={device.deviceId}>
                                        {device.label || `Microphone ${device.deviceId.substring(0, 8)}`}
                                    </option>
                                ))}
                            </select>
                            <button className="refresh-btn" onClick={loadAudioDevices} title="Refresh device list">
                                🔄
                            </button>
                        </div>
                        {audioDevices.length === 0 && (
                            <p className="mic-note">Click 🔄 to scan for microphones. You may need to allow microphone access when prompted.</p>
                        )}
                        {audioDevices.length > 0 && (
                            <p className="mic-count">{audioDevices.length} microphone(s) available</p>
                        )}
                    </div>

                    {/* Speaker Settings Section */}
                    <div className="settings-section">
                        <h3>🔊 Speaker Settings</h3>
                        <p className="settings-note">Select which speaker/headphones to use for voice call audio</p>
                        <div className="mic-settings">
                            <select
                                className="mic-select"
                                value={selectedSpeakerId}
                                onChange={(e) => setSelectedSpeakerId(e.target.value)}
                            >
                                <option value="default">System Default</option>
                                {audioOutputDevices.map((device) => (
                                    <option key={device.deviceId} value={device.deviceId}>
                                        {device.label || `Speaker ${device.deviceId.substring(0, 8)}`}
                                    </option>
                                ))}
                            </select>
                            <button className="refresh-btn" onClick={loadAudioDevices} title="Refresh device list">
                                🔄
                            </button>
                        </div>
                        {audioOutputDevices.length === 0 && (
                            <p className="mic-note">Click 🔄 to scan for audio output devices.</p>
                        )}
                        {audioOutputDevices.length > 0 && (
                            <p className="mic-count">{audioOutputDevices.length} speaker(s) available</p>
                        )}
                    </div>

                    {/* Video Calls Section */}
                    <div className="settings-section video-settings-section">
                        <h3>📹 Video Calls</h3>
                        <p className="settings-note">Tune video quality, devices, and accessibility for video calls</p>

                        <div className="video-settings-grid">
                            <div className="setting-item">
                                <label>Video Quality</label>
                                <select
                                    value={videoSettings.quality}
                                    onChange={(e) => updateVideoSettings({ quality: e.target.value as VideoQuality })}
                                >
                                    <option value="low">Low (320p)</option>
                                    <option value="medium">Medium (480p)</option>
                                    <option value="high">High (720p)</option>
                                    <option value="hd">HD (1080p)</option>
                                </select>
                            </div>

                            <div className="setting-item">
                                <label>Max Bandwidth</label>
                                <select
                                    value={videoSettings.maxBandwidth}
                                    onChange={(e) => updateVideoSettings({ maxBandwidth: parseInt(e.target.value, 10) })}
                                >
                                    <option value="256">256 kbps</option>
                                    <option value="512">512 kbps</option>
                                    <option value="1024">1024 kbps</option>
                                    <option value="2048">2048 kbps</option>
                                    <option value="0">Unlimited</option>
                                </select>
                            </div>

                            <div className="setting-item">
                                <label>Frame Rate</label>
                                <select
                                    value={videoSettings.frameRate}
                                    onChange={(e) => updateVideoSettings({ frameRate: parseInt(e.target.value, 10) as VideoSettings['frameRate'] })}
                                >
                                    <option value="15">15 fps</option>
                                    <option value="24">24 fps</option>
                                    <option value="30">30 fps</option>
                                </select>
                            </div>

                            <div className="setting-item toggle-setting">
                                <span>Auto Quality</span>
                                <div
                                    className={`settings-toggle-switch ${videoSettings.autoQuality ? 'active' : ''}`}
                                    onClick={() => updateVideoSettings({ autoQuality: !videoSettings.autoQuality })}
                                />
                            </div>

                            <div className="setting-item toggle-setting">
                                <span>Low Bandwidth Mode</span>
                                <div
                                    className={`settings-toggle-switch ${videoSettings.lowBandwidthMode ? 'active' : ''}`}
                                    onClick={() => updateVideoSettings({ lowBandwidthMode: !videoSettings.lowBandwidthMode })}
                                />
                            </div>
                        </div>

                        <div className="video-settings-subsection">
                            <h4>Devices</h4>
                            <div className="mic-settings">
                                <select
                                    className="mic-select"
                                    value={selectedCameraId}
                                    onChange={(e) => setSelectedCameraId(e.target.value)}
                                >
                                    <option value="default">System Default Camera</option>
                                    {videoDevices.map((device) => (
                                        <option key={device.deviceId} value={device.deviceId}>
                                            {device.label || `Camera ${device.deviceId.substring(0, 8)}`}
                                        </option>
                                    ))}
                                </select>
                                <button className="refresh-btn" onClick={loadVideoDevices} title="Refresh camera list">
                                    🔄
                                </button>
                            </div>
                            {videoDevices.length === 0 && (
                                <p className="mic-note">Click 🔄 to scan for cameras. You may need to allow camera access.</p>
                            )}
                            {videoDevices.length > 0 && (
                                <p className="mic-count">{videoDevices.length} camera(s) available</p>
                            )}

                            <div className="mic-settings">
                                <select
                                    className="mic-select"
                                    value={selectedMicId}
                                    onChange={(e) => setSelectedMicId(e.target.value)}
                                >
                                    <option value="default">System Default Microphone</option>
                                    {audioDevices.map((device) => (
                                        <option key={device.deviceId} value={device.deviceId}>
                                            {device.label || `Microphone ${device.deviceId.substring(0, 8)}`}
                                        </option>
                                    ))}
                                </select>
                                <button className="refresh-btn" onClick={loadAudioDevices} title="Refresh microphone list">
                                    🔄
                                </button>
                            </div>

                            <div className="setting-item toggle-setting">
                                <span>Mirror Local Video</span>
                                <div
                                    className={`settings-toggle-switch ${videoSettings.mirrorLocal ? 'active' : ''}`}
                                    onClick={() => updateVideoSettings({ mirrorLocal: !videoSettings.mirrorLocal })}
                                />
                            </div>
                            <div className="setting-item toggle-setting">
                                <span>Start with Camera Off</span>
                                <div
                                    className={`settings-toggle-switch ${videoSettings.muteVideoOnJoin ? 'active' : ''}`}
                                    onClick={() => updateVideoSettings({ muteVideoOnJoin: !videoSettings.muteVideoOnJoin })}
                                />
                            </div>
                            <div className="setting-item toggle-setting">
                                <span>Start Muted</span>
                                <div
                                    className={`settings-toggle-switch ${videoSettings.muteAudioOnJoin ? 'active' : ''}`}
                                    onClick={() => updateVideoSettings({ muteAudioOnJoin: !videoSettings.muteAudioOnJoin })}
                                />
                            </div>
                        </div>

                        <div className="video-settings-subsection">
                            <h4>Transport Mode</h4>
                            <div className="transport-options">
                                <label className="transport-option">
                                    <input
                                        type="radio"
                                        name="transportMode"
                                        value="webrtc"
                                        checked={videoSettings.transportMode === 'webrtc'}
                                        onChange={() => updateVideoSettings({ transportMode: 'webrtc' })}
                                    />
                                    <span>WebRTC (P2P)</span>
                                </label>
                                <label className="transport-option">
                                    <input
                                        type="radio"
                                        name="transportMode"
                                        value="blockchain"
                                        checked={videoSettings.transportMode === 'blockchain'}
                                        onChange={() => updateVideoSettings({ transportMode: 'blockchain' })}
                                    />
                                    <span>Blockchain Relay</span>
                                </label>
                                <label className="transport-option">
                                    <input
                                        type="radio"
                                        name="transportMode"
                                        value="hybrid"
                                        checked={videoSettings.transportMode === 'hybrid'}
                                        onChange={() => updateVideoSettings({ transportMode: 'hybrid' })}
                                    />
                                    <span>Hybrid (Auto)</span>
                                </label>
                            </div>
                        </div>

                        <div className="video-settings-subsection">
                            <h4>Advanced</h4>
                            <div className="setting-item">
                                <label>Background Blur</label>
                                <select
                                    value={videoSettings.backgroundBlur}
                                    onChange={(e) => updateVideoSettings({ backgroundBlur: e.target.value as VideoSettings['backgroundBlur'] })}
                                >
                                    <option value="off">Off</option>
                                    <option value="light">Light</option>
                                    <option value="heavy">Heavy</option>
                                </select>
                            </div>
                            <div className="setting-item toggle-setting">
                                <span>Noise Suppression</span>
                                <div
                                    className={`settings-toggle-switch ${videoSettings.noiseSupression ? 'active' : ''}`}
                                    onClick={() => updateVideoSettings({ noiseSupression: !videoSettings.noiseSupression })}
                                />
                            </div>
                            <div className="setting-item toggle-setting">
                                <span>Echo Cancellation</span>
                                <div
                                    className={`settings-toggle-switch ${videoSettings.echoCancellation ? 'active' : ''}`}
                                    onClick={() => updateVideoSettings({ echoCancellation: !videoSettings.echoCancellation })}
                                />
                            </div>
                            <div className="setting-item toggle-setting">
                                <span>Hardware Acceleration</span>
                                <div
                                    className={`settings-toggle-switch ${videoSettings.hardwareAcceleration ? 'active' : ''}`}
                                    onClick={() => updateVideoSettings({ hardwareAcceleration: !videoSettings.hardwareAcceleration })}
                                />
                            </div>
                        </div>

                        <div className="video-settings-subsection">
                            <h4>Accessibility</h4>
                            <div className="setting-item toggle-setting">
                                <span>High Contrast Controls</span>
                                <div
                                    className={`settings-toggle-switch ${videoSettings.highContrastControls ? 'active' : ''}`}
                                    onClick={() => updateVideoSettings({ highContrastControls: !videoSettings.highContrastControls })}
                                />
                            </div>
                            <div className="setting-item toggle-setting">
                                <span>Large Control Buttons</span>
                                <div
                                    className={`settings-toggle-switch ${videoSettings.largeControlButtons ? 'active' : ''}`}
                                    onClick={() => updateVideoSettings({ largeControlButtons: !videoSettings.largeControlButtons })}
                                />
                            </div>
                            <div className="setting-item toggle-setting">
                                <span>Screen Reader Announcements</span>
                                <div
                                    className={`settings-toggle-switch ${videoSettings.screenReaderAnnouncements ? 'active' : ''}`}
                                    onClick={() => updateVideoSettings({ screenReaderAnnouncements: !videoSettings.screenReaderAnnouncements })}
                                />
                            </div>
                            <div className="setting-item toggle-setting">
                                <span>Keyboard Shortcuts</span>
                                <div
                                    className={`settings-toggle-switch ${videoSettings.keyboardShortcuts ? 'active' : ''}`}
                                    onClick={() => updateVideoSettings({ keyboardShortcuts: !videoSettings.keyboardShortcuts })}
                                />
                            </div>
                        </div>

                        <div className="video-settings-actions">
                            <button className="test-camera-btn" onClick={toggleVideoPreview}>
                                {isVideoPreviewing ? 'Stop Camera Preview' : 'Test Camera'}
                            </button>
                            <button className="reset-video-btn" onClick={() => setVideoSettings(DEFAULT_VIDEO_SETTINGS)}>
                                Reset to Defaults
                            </button>
                        </div>

                        {isVideoPreviewing && (
                            <div className="video-preview-panel">
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className={`settings-video-preview ${videoSettings.mirrorLocal ? 'mirrored' : ''}`}
                                />
                            </div>
                        )}
                    </div>

                    {/* Identity Section */}
                    {identity && (
                        <div className="settings-section">
                            <h3>🔐 Identity</h3>
                            <div className="identity-info">
                                <div className="info-row">
                                    <span className="info-label">User ID:</span>
                                    <span className="info-value mono">{identity.userId}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Node ID:</span>
                                    <span className="info-value mono">{identity.nodeId.substring(0, 30)}...</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Created:</span>
                                    <span className="info-value">{new Date(identity.created).toLocaleDateString()}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Device:</span>
                                    <span className="info-value">{identity.platform.hostname} ({identity.platform.system})</span>
                                </div>
                            </div>
                            <p className="identity-note">
                                🛡️ Your identity is linked to this device. Even if you change your display name,
                                admins can track your real identity for moderation purposes.
                            </p>

                            {/* Admin Status */}
                            {adminStatus && (
                                <div className="admin-status-box">
                                    <div className="admin-status-header">
                                        {adminStatus.isSupreme ? '👑' : adminStatus.isAdmin ? '🛡️' : adminStatus.isModerator ? '⚔️' : '👤'}
                                        <span>Role: <strong>{adminStatus.role.toUpperCase()}</strong></span>
                                    </div>
                                    {adminStatus.isSupreme && (
                                        <div className="admin-status-detail supreme">
                                            SUPREME ADMIN - Full control over RangerBlock network
                                        </div>
                                    )}
                                    {adminStatus.isAdmin && !adminStatus.isSupreme && (
                                        <div className="admin-status-detail admin">
                                            ADMIN - Can approve users, moderate chat, manage bans
                                        </div>
                                    )}
                                    {adminStatus.isModerator && (
                                        <div className="admin-status-detail mod">
                                            MODERATOR - Can moderate chat and report users
                                        </div>
                                    )}
                                    {!adminStatus.isAdmin && !adminStatus.isModerator && !adminStatus.isSupreme && (
                                        <div className="admin-status-detail user">
                                            Standard user - No special permissions
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Blockchain Transactions Section */}
                    <div className="settings-section blockchain-section">
                        <div className="section-header-row">
                            <h3>⛓️ Blockchain Transactions</h3>
                            <button
                                className={`toggle-btn ${showTransactions ? 'active' : ''}`}
                                onClick={() => setShowTransactions(!showTransactions)}
                            >
                                {showTransactions ? 'Hide' : 'Show'}
                            </button>
                        </div>

                        {/* Transaction Stats */}
                        <div className="tx-stats">
                            <div className="tx-stat">
                                <span className="stat-icon">📤</span>
                                <span className="stat-value">{txStats.sent}</span>
                                <span className="stat-label">Sent</span>
                            </div>
                            <div className="tx-stat">
                                <span className="stat-icon">📥</span>
                                <span className="stat-value">{txStats.received}</span>
                                <span className="stat-label">Received</span>
                            </div>
                            <div className="tx-stat">
                                <span className="stat-icon">📊</span>
                                <span className="stat-value">{txStats.total}</span>
                                <span className="stat-label">Total</span>
                            </div>
                            <div className="tx-stat">
                                <span className="stat-icon">💾</span>
                                <span className="stat-value">{(txStats.bytes / 1024).toFixed(1)}KB</span>
                                <span className="stat-label">Data</span>
                            </div>
                        </div>

                        {/* Transaction Feed */}
                        {showTransactions && (
                            <div className="tx-feed">
                                <div className="tx-feed-header">
                                    <span className="feed-title">Live Transaction Feed</span>
                                    <span className="feed-count">{transactions.length} transactions</span>
                                </div>
                                <div className="tx-list">
                                    {transactions.length === 0 ? (
                                        <div className="tx-empty">
                                            <span>No transactions yet</span>
                                            <span className="tx-empty-hint">Connect to chat to see blockchain activity</span>
                                        </div>
                                    ) : (
                                        transactions.map(tx => (
                                            <div key={tx.id} className={`tx-item tx-${tx.direction} tx-type-${tx.type}`}>
                                                <div className="tx-header">
                                                    <span className={`tx-direction ${tx.direction}`}>
                                                        {tx.direction === 'in' ? '📥' : '📤'}
                                                    </span>
                                                    <span className="tx-id">{tx.id.substring(0, 14)}...</span>
                                                    <span className={`tx-status ${tx.status}`}>{tx.status}</span>
                                                </div>
                                                <div className="tx-body">
                                                    <div className="tx-route">
                                                        <span className="tx-from" title={tx.from}>
                                                            {tx.from.length > 12 ? tx.from.substring(0, 12) + '...' : tx.from}
                                                        </span>
                                                        <span className="tx-arrow">→</span>
                                                        <span className="tx-to" title={tx.to}>
                                                            {tx.to.length > 12 ? tx.to.substring(0, 12) + '...' : tx.to}
                                                        </span>
                                                    </div>
                                                    <div className="tx-payload">{tx.payload}</div>
                                                </div>
                                                <div className="tx-footer">
                                                    <span className="tx-size">{tx.size} bytes</span>
                                                    <span className="tx-time">
                                                        {new Date(tx.timestamp).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Smart Contracts Section */}
                    <div className="settings-section contracts-section">
                        <div className="section-header-row">
                            <h3>📜 Smart Contracts</h3>
                            <div className="chain-selector">
                                <button
                                    className={`chain-btn ${preferredChain === 'solana' ? 'active' : ''}`}
                                    onClick={() => setPreferredChain('solana')}
                                >
                                    ◎ Solana
                                </button>
                                <button
                                    className={`chain-btn ${preferredChain === 'ethereum' ? 'active' : ''}`}
                                    onClick={() => setPreferredChain('ethereum')}
                                >
                                    ⟠ Ethereum
                                </button>
                            </div>
                        </div>

                        <div className="contracts-grid">
                            {contracts
                                .filter(c => c.chain === 'both' || c.chain === preferredChain)
                                .map(contract => (
                                    <div
                                        key={contract.id}
                                        className={`contract-card ${selectedContract?.id === contract.id ? 'selected' : ''}`}
                                        onClick={() => {
                                            setSelectedContract(contract)
                                            setShowContractDetails(true)
                                        }}
                                    >
                                        <div className="contract-header">
                                            <span className="contract-icon">{contract.icon}</span>
                                            <span className="contract-name">{contract.name}</span>
                                            <span className={`contract-chain chain-${contract.chain}`}>
                                                {contract.chain === 'both' ? '◎⟠' : contract.chain === 'solana' ? '◎' : '⟠'}
                                            </span>
                                        </div>
                                        <p className="contract-description">{contract.description}</p>
                                        <div className="contract-category">
                                            <span className={`category-badge cat-${contract.category}`}>
                                                {contract.category}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                        </div>

                        {/* Contract Details Modal */}
                        {showContractDetails && selectedContract && (
                            <div className="contract-details-overlay" onClick={() => setShowContractDetails(false)}>
                                <div className="contract-details" onClick={e => e.stopPropagation()}>
                                    <div className="details-header">
                                        <span className="details-icon">{selectedContract.icon}</span>
                                        <h3>{selectedContract.name}</h3>
                                        <button className="close-details" onClick={() => setShowContractDetails(false)}>✕</button>
                                    </div>

                                    <div className="details-body">
                                        <p className="details-description">{selectedContract.description}</p>

                                        <div className="details-chain">
                                            <span className="label">Available on:</span>
                                            <span className="value">
                                                {selectedContract.chain === 'both' ? 'Solana & Ethereum' :
                                                    selectedContract.chain === 'solana' ? 'Solana' : 'Ethereum'}
                                            </span>
                                        </div>

                                        <div className="details-features">
                                            <span className="label">Features:</span>
                                            <ul className="features-list">
                                                {selectedContract.features.map((feature, i) => (
                                                    <li key={i}>{feature}</li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="details-files">
                                            <span className="label">Contract Files:</span>
                                            <div className="file-list">
                                                {(selectedContract.chain === 'both' || selectedContract.chain === 'solana') && (
                                                    <code className="file-path">
                                                        Blockchain/contracts/solana/ranger_{selectedContract.category === 'registration' ? 'registration' :
                                                            selectedContract.category === 'bridge' ? 'bridge' :
                                                                selectedContract.category === 'transfer' ? 'file_transfer' : 'token'}.rs
                                                    </code>
                                                )}
                                                {(selectedContract.chain === 'both' || selectedContract.chain === 'ethereum') && (
                                                    <code className="file-path">
                                                        Blockchain/contracts/Ranger{selectedContract.category === 'registration' ? 'Registration' :
                                                            selectedContract.category === 'bridge' ? 'Bridge' :
                                                                selectedContract.category === 'transfer' ? 'FileTransfer' : 'Token'}.sol
                                                    </code>
                                                )}
                                            </div>
                                        </div>

                                        <div className="details-status">
                                            <span className={`status-badge status-${selectedContract.status}`}>
                                                {selectedContract.status === 'available' ? '🟢 Available' :
                                                    selectedContract.status === 'deployed' ? '🔵 Deployed' : '⭐ Selected'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="details-actions">
                                        <button
                                            className="action-btn select-btn"
                                            onClick={() => {
                                                setContracts(prev => prev.map(c => ({
                                                    ...c,
                                                    status: c.id === selectedContract.id ? 'selected' : c.status === 'selected' ? 'available' : c.status
                                                })))
                                                setSelectedContract({ ...selectedContract, status: 'selected' })
                                            }}
                                        >
                                            {selectedContract.status === 'selected' ? '⭐ Selected' : 'Select Contract'}
                                        </button>
                                        <button
                                            className="action-btn deploy-btn"
                                            onClick={() => window.open(
                                                preferredChain === 'solana'
                                                    ? 'https://beta.solpg.io'
                                                    : 'https://remix.ethereum.org',
                                                '_blank'
                                            )}
                                        >
                                            🚀 Deploy on {preferredChain === 'solana' ? 'Solana Playground' : 'Remix IDE'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <p className="contracts-note">
                            📜 Select a contract to view details. Deploy contracts using{' '}
                            <a href="https://beta.solpg.io" target="_blank" rel="noopener">Solana Playground</a> or{' '}
                            <a href="https://remix.ethereum.org" target="_blank" rel="noopener">Remix IDE</a>.
                        </p>
                    </div>

                    {/* Theme Section */}
                    <div className="settings-section">
                        <h3>🎨 Theme</h3>
                        <div className="theme-grid">
                            {(Object.keys(THEMES) as ThemeName[]).map(t => (
                                <button
                                    key={t}
                                    className={`theme-option ${theme === t ? 'active' : ''}`}
                                    onClick={() => setTheme(t)}
                                >
                                    <span className="theme-icon">{THEMES[t].icon}</span>
                                    <span className="theme-name">{THEMES[t].name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Radio Screensaver Section */}
                    <div className="settings-section">
                        <h3>🎬 Radio Screensaver</h3>
                        <p className="section-description">Background effects for the Radio/Podcast panel</p>

                        {/* Enable Toggle */}
                        <div className="settings-screensaver-toggle">
                            <span>Enable Screensaver</span>
                            <div
                                className={`settings-toggle-switch ${radioSettings.screensaverEnabled ? 'active' : ''}`}
                                onClick={() => handleRadioSettingsChange({ screensaverEnabled: !radioSettings.screensaverEnabled })}
                            />
                        </div>

                        {radioSettings.screensaverEnabled && (
                            <>
                                {/* Mode Selection */}
                                <div className="setting-item">
                                    <label>Background Mode</label>
                                    <select
                                        value={radioSettings.screensaverMode || 'slideshow'}
                                        onChange={(e) => handleRadioSettingsChange({ screensaverMode: e.target.value as 'slideshow' | 'matrix' | 'none' })}
                                    >
                                        <option value="slideshow">🖼️ Image Slideshow</option>
                                        <option value="matrix">💚 Matrix Rain</option>
                                        <option value="none">⬛ None (Solid)</option>
                                    </select>
                                </div>

                                {/* Opacity Slider */}
                                <div className="setting-item">
                                    <label>Opacity: {radioSettings.screensaverOpacity ?? 30}%</label>
                                    <input
                                        type="range"
                                        min="10"
                                        max="100"
                                        value={radioSettings.screensaverOpacity ?? 30}
                                        onChange={(e) => handleRadioSettingsChange({ screensaverOpacity: parseInt(e.target.value) })}
                                    />
                                </div>

                                {/* Slideshow-specific settings */}
                                {radioSettings.screensaverMode === 'slideshow' && (
                                    <>
                                        <div className="setting-item">
                                            <label>Slide Interval (seconds)</label>
                                            <input
                                                type="number"
                                                min="5"
                                                max="60"
                                                value={radioSettings.screensaverInterval ?? 10}
                                                onChange={(e) => handleRadioSettingsChange({ screensaverInterval: parseInt(e.target.value) })}
                                            />
                                        </div>

                                        <div className="setting-item">
                                            <label>Transition Effect</label>
                                            <select
                                                value={radioSettings.screensaverTransition || 'fade'}
                                                onChange={(e) => handleRadioSettingsChange({ screensaverTransition: e.target.value as 'fade' | 'slide' | 'zoom' | 'blur' | 'random' })}
                                            >
                                                <option value="fade">Fade</option>
                                                <option value="slide">Slide</option>
                                                <option value="zoom">Zoom</option>
                                                <option value="blur">Blur</option>
                                                <option value="random">🎲 Random</option>
                                            </select>
                                        </div>
                                    </>
                                )}

                                {/* Matrix on Idle Toggle */}
                                <div className="settings-screensaver-toggle">
                                    <span>Matrix Rain on Idle (2 min)</span>
                                    <div
                                        className={`settings-toggle-switch ${radioSettings.screensaverMatrixOnIdle ? 'active' : ''}`}
                                        onClick={() => handleRadioSettingsChange({ screensaverMatrixOnIdle: !radioSettings.screensaverMatrixOnIdle })}
                                    />
                                </div>

                                {radioSettings.screensaverMatrixOnIdle && (
                                    <div className="setting-item">
                                        <label>Idle Timeout (seconds)</label>
                                        <input
                                            type="number"
                                            min="30"
                                            max="600"
                                            value={radioSettings.screensaverIdleTimeout ?? 120}
                                            onChange={(e) => handleRadioSettingsChange({ screensaverIdleTimeout: parseInt(e.target.value) })}
                                        />
                                    </div>
                                )}

                                {/* Show Clock Toggle */}
                                <div className="settings-screensaver-toggle">
                                    <span>Show Clock on Radio</span>
                                    <div
                                        className={`settings-toggle-switch ${radioSettings.screensaverShowClock ? 'active' : ''}`}
                                        onClick={() => handleRadioSettingsChange({ screensaverShowClock: !radioSettings.screensaverShowClock })}
                                    />
                                </div>

                                {/* Matrix Rain Settings */}
                                {(radioSettings.screensaverMode === 'matrix' || radioSettings.screensaverMatrixOnIdle) && (
                                    <div className="matrix-settings-section">
                                        <h4>💚 Matrix Rain Settings</h4>

                                        <div className="setting-item">
                                            <label>Density: {radioSettings.matrixDensity ?? 3} (character size)</label>
                                            <input
                                                type="range"
                                                min="1"
                                                max="5"
                                                value={radioSettings.matrixDensity ?? 3}
                                                onChange={(e) => handleRadioSettingsChange({ matrixDensity: parseInt(e.target.value) })}
                                            />
                                            <span className="range-labels"><span>Small</span><span>Large</span></span>
                                        </div>

                                        <div className="setting-item">
                                            <label>Speed: {radioSettings.matrixSpeed ?? 3}</label>
                                            <input
                                                type="range"
                                                min="1"
                                                max="5"
                                                value={radioSettings.matrixSpeed ?? 3}
                                                onChange={(e) => handleRadioSettingsChange({ matrixSpeed: parseInt(e.target.value) })}
                                            />
                                            <span className="range-labels"><span>Slow</span><span>Fast</span></span>
                                        </div>

                                        <div className="setting-item">
                                            <label>Brightness: {radioSettings.matrixBrightness ?? 4}</label>
                                            <input
                                                type="range"
                                                min="1"
                                                max="5"
                                                value={radioSettings.matrixBrightness ?? 4}
                                                onChange={(e) => handleRadioSettingsChange({ matrixBrightness: parseInt(e.target.value) })}
                                            />
                                            <span className="range-labels"><span>Dim</span><span>Bright</span></span>
                                        </div>

                                        <div className="setting-item">
                                            <label>Trail Length: {radioSettings.matrixTrailLength ?? 3}</label>
                                            <input
                                                type="range"
                                                min="1"
                                                max="5"
                                                value={radioSettings.matrixTrailLength ?? 3}
                                                onChange={(e) => handleRadioSettingsChange({ matrixTrailLength: parseInt(e.target.value) })}
                                            />
                                            <span className="range-labels"><span>Long</span><span>Short</span></span>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Chat Screensaver Section */}
                    <div className="settings-section">
                        <h3>💬 Chat Screensaver</h3>
                        <p className="section-description">Background effects for the Chat area</p>

                        <div className="setting-item toggle-setting">
                            <span>Enable Chat Screensaver</span>
                            <div
                                className={`settings-toggle-switch ${radioSettings.chatScreensaverEnabled ? 'active' : ''}`}
                                onClick={() => handleRadioSettingsChange({ chatScreensaverEnabled: !radioSettings.chatScreensaverEnabled })}
                            />
                        </div>

                        {radioSettings.chatScreensaverEnabled && (
                            <>
                                <div className="setting-item">
                                    <label>Background Mode</label>
                                    <select
                                        value={radioSettings.chatScreensaverMode ?? 'matrix'}
                                        onChange={(e) => handleRadioSettingsChange({ chatScreensaverMode: e.target.value as 'slideshow' | 'matrix' | 'none' })}
                                    >
                                        <option value="matrix">Matrix Rain</option>
                                        <option value="slideshow">Slideshow</option>
                                        <option value="none">None</option>
                                    </select>
                                </div>

                                <div className="setting-item">
                                    <label>Opacity: {radioSettings.chatScreensaverOpacity ?? 30}%</label>
                                    <input
                                        type="range"
                                        min="10"
                                        max="100"
                                        value={radioSettings.chatScreensaverOpacity ?? 30}
                                        onChange={(e) => handleRadioSettingsChange({ chatScreensaverOpacity: parseInt(e.target.value) })}
                                    />
                                </div>

                                {radioSettings.chatScreensaverMode === 'slideshow' && (
                                    <>
                                        <div className="setting-item">
                                            <label>Slide Interval: {radioSettings.chatScreensaverInterval ?? 10}s</label>
                                            <input
                                                type="range"
                                                min="5"
                                                max="60"
                                                value={radioSettings.chatScreensaverInterval ?? 10}
                                                onChange={(e) => handleRadioSettingsChange({ chatScreensaverInterval: parseInt(e.target.value) })}
                                            />
                                        </div>

                                        <div className="setting-item">
                                            <label>Transition Effect</label>
                                            <select
                                                value={radioSettings.chatScreensaverTransition ?? 'fade'}
                                                onChange={(e) => handleRadioSettingsChange({ chatScreensaverTransition: e.target.value as 'fade' | 'slide' | 'zoom' | 'blur' | 'random' })}
                                            >
                                                <option value="fade">Fade</option>
                                                <option value="slide">Slide</option>
                                                <option value="zoom">Zoom</option>
                                                <option value="blur">Blur</option>
                                                <option value="random">Random</option>
                                            </select>
                                        </div>
                                    </>
                                )}

                                <div className="setting-item toggle-setting">
                                    <span>Matrix Rain on Idle</span>
                                    <div
                                        className={`settings-toggle-switch ${radioSettings.chatScreensaverMatrixOnIdle ? 'active' : ''}`}
                                        onClick={() => handleRadioSettingsChange({ chatScreensaverMatrixOnIdle: !radioSettings.chatScreensaverMatrixOnIdle })}
                                    />
                                </div>

                                {radioSettings.chatScreensaverMatrixOnIdle && (
                                    <div className="setting-item">
                                        <label>Idle Timeout: {radioSettings.chatScreensaverIdleTimeout ?? 120}s</label>
                                        <input
                                            type="range"
                                            min="30"
                                            max="600"
                                            step="30"
                                            value={radioSettings.chatScreensaverIdleTimeout ?? 120}
                                            onChange={(e) => handleRadioSettingsChange({ chatScreensaverIdleTimeout: parseInt(e.target.value) })}
                                        />
                                    </div>
                                )}

                                <div className="setting-item toggle-setting">
                                    <span>Show Clock</span>
                                    <div
                                        className={`settings-toggle-switch ${radioSettings.chatScreensaverShowClock ? 'active' : ''}`}
                                        onClick={() => handleRadioSettingsChange({ chatScreensaverShowClock: !radioSettings.chatScreensaverShowClock })}
                                    />
                                </div>

                                {/* Chat Matrix Rain Settings */}
                                {(radioSettings.chatScreensaverMode === 'matrix' || radioSettings.chatScreensaverMatrixOnIdle) && (
                                    <div className="matrix-settings-section">
                                        <h4>💚 Chat Matrix Rain Settings</h4>

                                        <div className="setting-item">
                                            <label>Density: {radioSettings.chatMatrixDensity ?? 3} (character size)</label>
                                            <input
                                                type="range"
                                                min="1"
                                                max="5"
                                                value={radioSettings.chatMatrixDensity ?? 3}
                                                onChange={(e) => handleRadioSettingsChange({ chatMatrixDensity: parseInt(e.target.value) })}
                                            />
                                            <span className="range-labels"><span>Sparse</span><span>Dense</span></span>
                                        </div>

                                        <div className="setting-item">
                                            <label>Speed: {radioSettings.chatMatrixSpeed ?? 3}</label>
                                            <input
                                                type="range"
                                                min="1"
                                                max="5"
                                                value={radioSettings.chatMatrixSpeed ?? 3}
                                                onChange={(e) => handleRadioSettingsChange({ chatMatrixSpeed: parseInt(e.target.value) })}
                                            />
                                            <span className="range-labels"><span>Slow</span><span>Fast</span></span>
                                        </div>

                                        <div className="setting-item">
                                            <label>Brightness: {radioSettings.chatMatrixBrightness ?? 4}</label>
                                            <input
                                                type="range"
                                                min="1"
                                                max="5"
                                                value={radioSettings.chatMatrixBrightness ?? 4}
                                                onChange={(e) => handleRadioSettingsChange({ chatMatrixBrightness: parseInt(e.target.value) })}
                                            />
                                            <span className="range-labels"><span>Dim</span><span>Bright</span></span>
                                        </div>

                                        <div className="setting-item">
                                            <label>Trail Length: {radioSettings.chatMatrixTrailLength ?? 3}</label>
                                            <input
                                                type="range"
                                                min="1"
                                                max="5"
                                                value={radioSettings.chatMatrixTrailLength ?? 3}
                                                onChange={(e) => handleRadioSettingsChange({ chatMatrixTrailLength: parseInt(e.target.value) })}
                                            />
                                            <span className="range-labels"><span>Long</span><span>Short</span></span>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Login Picture Section */}
                    <div className="settings-section">
                        <h3>🖼️ Login Picture</h3>
                        <p className="section-description">Customize your login screen picture</p>

                        <div className="login-picture-preview">
                            {loginPicture === 'default' ? (
                                <div className="preview-emoji">🦅</div>
                            ) : loginPicture === 'rangersmyth' ? (
                                <img src="./rangersmyth-pic.png" alt="RangerSmyth" className="preview-image" />
                            ) : (
                                <img src={loginPicture} alt="Custom" className="preview-image" />
                            )}
                        </div>

                        <div className="login-picture-options">
                            <button
                                className={`picture-option ${loginPicture === 'default' ? 'active' : ''}`}
                                onClick={() => setLoginPicture('default')}
                            >
                                <span className="option-icon">🦅</span>
                                <span className="option-label">Eagle (Default)</span>
                            </button>

                            <button
                                className={`picture-option ${loginPicture === 'rangersmyth' ? 'active' : ''}`}
                                onClick={() => setLoginPicture('rangersmyth')}
                            >
                                <span className="option-icon">🎖️</span>
                                <span className="option-label">RangerSmyth</span>
                            </button>

                            <button
                                className={`picture-option ${loginPicture.startsWith('data:') ? 'active' : ''}`}
                                onClick={() => loginPictureInputRef.current?.click()}
                            >
                                <span className="option-icon">📤</span>
                                <span className="option-label">Upload Custom</span>
                            </button>
                        </div>

                        <input
                            ref={loginPictureInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleLoginPictureUpload}
                            style={{ display: 'none' }}
                        />

                        {loginPicture.startsWith('data:') && (
                            <button
                                className="reset-picture-btn"
                                onClick={() => setLoginPicture('default')}
                            >
                                Reset to Default
                            </button>
                        )}
                    </div>

                    {/* Update Notifications Section */}
                    <div className="settings-section">
                        <h3>🔔 Notifications</h3>
                        <div className="notification-toggle">
                            <label className="toggle-row">
                                <span className="toggle-label">Update Notifications</span>
                                <button
                                    className={`toggle-switch ${updateNotificationsEnabled ? 'active' : ''}`}
                                    onClick={() => setUpdateNotificationsEnabled(!updateNotificationsEnabled)}
                                >
                                    <span className="toggle-slider"></span>
                                </button>
                            </label>
                            <p className="toggle-note">
                                {updateNotificationsEnabled
                                    ? 'You will be notified when updates are available'
                                    : 'Update notifications are disabled'}
                            </p>
                        </div>
                    </div>

                    {/* Weather Alerts Section */}
                    <div className="settings-section">
                        <h3>🌦️ Weather Alerts</h3>
                        <div className="notification-toggle">
                            <label className="toggle-row">
                                <span className="toggle-label">Rain Alerts (local)</span>
                                <button
                                    className={`toggle-switch ${rainAlertsEnabled ? 'active' : ''}`}
                                    onClick={() => setRainAlertsEnabled(!rainAlertsEnabled)}
                                >
                                    <span className="toggle-slider"></span>
                                </button>
                            </label>
                            <p className="toggle-note">
                                {rainAlertsEnabled
                                    ? 'Rain alerts are active while the app is open.'
                                    : 'Rain alerts are disabled.'}
                            </p>
                        </div>
                        <div className="setting-item">
                            <label>Lookahead Window (hours)</label>
                            <input
                                type="number"
                                min="1"
                                max="24"
                                value={rainAlertLookaheadHours}
                                onChange={(e) => {
                                    const next = Math.max(1, Math.min(24, Number(e.target.value)))
                                    setRainAlertLookaheadHours(Number.isFinite(next) ? next : 3)
                                }}
                            />
                        </div>
                        <div className="setting-item">
                            <label>Location (auto-detect)</label>
                            <input
                                type="text"
                                readOnly
                                value={weatherLocation?.label || ''}
                                placeholder="Not detected yet"
                            />
                            <div className="weather-actions">
                                <button
                                    onClick={async () => {
                                        try {
                                            await detectLocationByIP()
                                        } catch (error: any) {
                                            setWeatherStatus('error')
                                            setWeatherError(error?.message || 'Unable to detect location')
                                        }
                                    }}
                                >
                                    Refresh (IP)
                                </button>
                                <button
                                    onClick={async () => {
                                        try {
                                            await detectLocationByGPS()
                                        } catch (error: any) {
                                            setWeatherStatus('error')
                                            setWeatherError(error?.message || 'Unable to access GPS')
                                        }
                                    }}
                                >
                                    Use GPS
                                </button>
                                <button
                                    onClick={() => {
                                        void handleWeatherCommand()
                                    }}
                                >
                                    Preview Weather
                                </button>
                            </div>
                            <p className="weather-location-status">
                                {weatherStatus === 'loading' && 'Detecting location...'}
                                {weatherStatus !== 'loading' && weatherError}
                                {weatherStatus !== 'loading' && !weatherError && weatherLocation && (
                                    <>Updated {formatLocationAge(weatherLocation.updatedAt)} via {weatherLocation.source.toUpperCase()}.</>
                                )}
                                {weatherStatus !== 'loading' && !weatherError && !weatherLocation && 'No location detected yet.'}
                            </p>
                        </div>
                    </div>

                    {/* Media & API Keys Section */}
                    <div className="settings-section">
                        <h3>🖼️ Media & API Keys</h3>
                        <p className="section-description">Configure external services for Memes & GIFs</p>

                        <div className="setting-item">
                            <label>Tenor API Key (for /gif)</label>
                            <div className="api-key-input-container">
                                <input
                                    type="password"
                                    value={tenorApiKey}
                                    onChange={(e) => setTenorApiKey(e.target.value)}
                                    placeholder="Enter your Google/Tenor API Key"
                                    className="api-key-input"
                                />
                            </div>
                            <p className="setting-hint">
                                Required for <code>/gif &lt;search&gt;</code> command.
                                <a href="https://developers.google.com/tenor/guides/quickstart" target="_blank" rel="noopener noreferrer" style={{ marginLeft: '5px', color: 'var(--primary-color)' }}>
                                    Get a free key here
                                </a>
                            </p>
                        </div>

                        <div className="setting-item">
                            <label>Meme Source (Free)</label>
                            <div className="setting-value-display">
                                meme-api.com (Reddit Scraper)
                            </div>
                            <p className="setting-hint">
                                Use <code>/meme</code> or <code>/meme &lt;subreddit&gt;</code>. No key required.
                            </p>
                        </div>
                    </div>

                    {/* Storage Section */}
                    {storagePaths && (
                        <div className="settings-section">
                            <h3>📁 Storage</h3>
                            <div className="storage-info">
                                <div className="info-row">
                                    <span className="info-label">Identity File:</span>
                                    <span className="info-value small">{storagePaths.identityFile}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">RangerPlex Folder:</span>
                                    <span className="info-value small">{storagePaths.personalDir}</span>
                                </div>
                            </div>
                            <p className="storage-note">
                                📦 Identity files are compatible with RangerPlex browser.
                            </p>
                        </div>
                    )}

                    {/* About Section */}
                    <div className="settings-section">
                        <h3>ℹ️ About</h3>
                        <div className="about-info">
                            <p><strong>RangerChat Lite</strong> v{APP_VERSION}</p>
                            <p>A lightweight chat client for the RangerPlex network.</p>
                            {/* Update Available Notice */}
                            {updateAvailable && (
                                <div className="update-notice">
                                    <span className="update-badge">🚀 Update Available: v{latestVersion}</span>
                                    <div className="update-actions">
                                        <button
                                            className="update-now-btn"
                                            onClick={handleRunUpdate}
                                            disabled={isUpdating}
                                        >
                                            {isUpdating ? (
                                                <>
                                                    <span className="spinner"></span>
                                                    {updateStatus || 'Updating...'}
                                                </>
                                            ) : (
                                                <>🔄 Update Now</>
                                            )}
                                        </button>
                                        {updateStatus && !isUpdating && (
                                            <p className="update-status success">{updateStatus}</p>
                                        )}
                                        {updateError && (
                                            <p className="update-status error">{updateError}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Manual Update Option */}
                            <div className="manual-update">
                                <button
                                    className="check-update-btn"
                                    onClick={handleRunUpdate}
                                    disabled={isUpdating}
                                >
                                    {isUpdating ? (
                                        <>
                                            <span className="spinner"></span>
                                            {updateStatus || 'Checking...'}
                                        </>
                                    ) : (
                                        <>🔍 Check for Updates</>
                                    )}
                                </button>
                                {!updateAvailable && updateStatus && (
                                    <p className="update-status success">{updateStatus}</p>
                                )}
                                {!updateAvailable && updateError && (
                                    <p className="update-status error">{updateError}</p>
                                )}
                                {updateStatus === '📦 Packaged App' && (
                                    <a
                                        href="https://github.com/davidtkeane/rangerplex-ai/releases"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="github-download-btn"
                                    >
                                        📥 Download Latest from GitHub
                                    </a>
                                )}
                            </div>
                            <p className="mission">🎖️ Mission: Transform disabilities into superpowers</p>
                            <p className="philosophy">"One foot in front of the other" - David Keane</p>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* LEDGER VIEW */}
        {view === 'ledger' && (
            <div className="ledger-screen">
                <div className="ledger-header">
                    <button className="back-btn" onClick={() => setView(connected ? 'chat' : 'login')}>
                        ← Back
                    </button>
                    <h2>⛓️ Blockchain Ledger</h2>
                    <button className="refresh-btn" onClick={refreshLedger} disabled={ledgerLoading}>
                        🔄
                    </button>
                </div>

                <div className="ledger-content">
                    {/* Status Section */}
                    {ledgerStatus && (
                        <div className="ledger-section status-section">
                            <h3>📊 Chain Status</h3>
                            <div className="status-grid">
                                <div className="status-item">
                                    <span className="status-value">{ledgerStatus.chainHeight}</span>
                                    <span className="status-label">Blocks</span>
                                </div>
                                <div className="status-item">
                                    <span className="status-value">{ledgerStatus.totalMessages}</span>
                                    <span className="status-label">Messages</span>
                                </div>
                                <div className="status-item">
                                    <span className="status-value">{ledgerStatus.pendingTransactions}</span>
                                    <span className="status-label">Pending</span>
                                </div>
                                <div className="status-item">
                                    <span className="status-value">{ledgerStatus.totalUsers}</span>
                                    <span className="status-label">Users</span>
                                </div>
                            </div>
                            <div className="status-details">
                                <div className="detail-row">
                                    <span className="detail-label">Last Block:</span>
                                    <span className="detail-value mono">{formatHash(ledgerStatus.lastBlockHash)}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Last Mined:</span>
                                    <span className="detail-value">
                                        {ledgerStatus.lastBlockTime ? formatTime(ledgerStatus.lastBlockTime) : 'Never'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions Section */}
                    <div className="ledger-section actions-section">
                        <h3>⚡ Actions</h3>
                        <div className="action-buttons">
                            <button
                                className="action-btn mine-btn"
                                onClick={manualMineBlock}
                                disabled={ledgerLoading || (ledgerStatus?.pendingTransactions === 0)}
                            >
                                ⛏️ Mine Block
                            </button>
                            <button className="action-btn export-btn" onClick={exportChain}>
                                📥 Export Chain
                            </button>
                        </div>
                        {ledgerStatus?.pendingTransactions === 0 && (
                            <p className="action-note">No pending transactions to mine</p>
                        )}
                    </div>

                    {/* Blocks Section */}
                    <div className="ledger-section blocks-section">
                        <h3>🧱 Recent Blocks</h3>
                        {ledgerLoading ? (
                            <div className="loading-blocks">Loading...</div>
                        ) : ledgerBlocks.length === 0 ? (
                            <div className="no-blocks">No blocks yet. Mine some transactions!</div>
                        ) : (
                            <div className="blocks-list">
                                {ledgerBlocks.map(block => (
                                    <div
                                        key={block.index}
                                        className={`block-card ${selectedBlock?.index === block.index ? 'selected' : ''}`}
                                        onClick={() => setSelectedBlock(selectedBlock?.index === block.index ? null : block)}
                                    >
                                        <div className="block-header">
                                            <span className="block-number">Block #{block.index}</span>
                                            <span className="block-txcount">{block.transactionCount} txs</span>
                                        </div>
                                        <div className="block-hash mono">{formatHash(block.hash)}</div>
                                        <div className="block-time">{formatTime(block.timestamp)}</div>

                                        {selectedBlock?.index === block.index && (
                                            <div className="block-details">
                                                <div className="detail-row">
                                                    <span className="detail-label">Merkle Root:</span>
                                                    <span className="detail-value mono">{formatHash(block.merkleRoot)}</span>
                                                </div>
                                                <div className="detail-row">
                                                    <span className="detail-label">Previous:</span>
                                                    <span className="detail-value mono">{formatHash(block.previousHash)}</span>
                                                </div>
                                                <div className="detail-row">
                                                    <span className="detail-label">Nonce:</span>
                                                    <span className="detail-value">{block.nonce}</span>
                                                </div>

                                                {block.transactions.length > 0 && (
                                                    <div className="block-transactions">
                                                        <h4>Transactions:</h4>
                                                        {block.transactions.map((tx, i) => (
                                                            <div key={i} className="tx-item">
                                                                <span className={`tx-type tx-type-${tx.type}`}>{tx.type}</span>
                                                                <span className="tx-sender">{tx.data?.senderName || tx.sender?.substring(0, 8) || 'System'}</span>
                                                                {tx.data?.content && (
                                                                    <span className="tx-content">
                                                                        {tx.data.content.substring(0, 50)}{tx.data.content.length > 50 ? '...' : ''}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info Section */}
                    <div className="ledger-section info-section">
                        <h3>ℹ️ About the Ledger</h3>
                        <p>
                            Every message is recorded on an immutable blockchain. Blocks are mined
                            automatically every 10 messages or 5 minutes using Proof of Work.
                        </p>
                        <p className="wallet-preview">
                            💰 <strong>Coming Soon:</strong> Wallet integration with token rewards!
                        </p>
                    </div>
                </div>
            </div>
        )}
    </div>
)
}

export default App
