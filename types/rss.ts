// 🎖️ RangerPlex RSS News Ticker - Type Definitions
// Types for RSS feed management and news ticker

export type RSSCategory =
    | 'pentesting'
    | 'malware'
    | 'forensics'
    | 'news'
    | 'dataGov'
    | 'blockchain';

export interface RSSFeed {
    id: string;
    name: string;
    url: string;
    category: RSSCategory;
    enabled: boolean;
    lastFetched: number | null;
    lastError: string | null;
    itemCount: number;
}

export interface RSSItem {
    id: string;
    feedId: string;
    feedName: string;
    title: string;
    link: string;
    pubDate: Date;
    description: string;
    category: RSSCategory;
    read: boolean;
    content?: string;
}

export interface RSSSettings {
    enabled: boolean;
    speed: number; // 1-10 (pixels per second)
    height: 'small' | 'medium' | 'large';
    autoRefreshInterval: number; // minutes
    clickAction: 'chat' | 'browser' | 'modal';
    showCategoryBadges: boolean;
    maxHeadlines: number;
    enabledCategories: RSSCategory[];
    pauseOnHover: boolean;
    feedOrder: 'newest' | 'random' | 'category';
    showNotesInTicker: boolean; // Show user study notes in the ticker
    displayMode: 'all' | 'rss-only' | 'notes-only' | 'single-category'; // What to show in ticker
    singleCategoryFilter?: RSSCategory; // Used when displayMode is 'single-category'
}

export interface RSSFeedTest {
    success: boolean;
    error?: string;
    preview?: {
        title: string;
        itemCount: number;
        latestItems: Array<{
            title: string;
            pubDate: string;
        }>;
    };
}

export interface RSSCategoryConfig {
    id: RSSCategory;
    name: string;
    icon: string;
    emoji: string;
    color: string;
    badgeColor: string;
}

// Default RSS settings
export const DEFAULT_RSS_SETTINGS: RSSSettings = {
    enabled: false,
    speed: 5,
    height: 'medium',
    autoRefreshInterval: 15,
    clickAction: 'chat',
    showCategoryBadges: true,
    maxHeadlines: 50,
    enabledCategories: ['pentesting', 'malware', 'forensics', 'news', 'dataGov', 'blockchain'],
    pauseOnHover: true,
    feedOrder: 'newest',
    showNotesInTicker: false, // Off by default
    displayMode: 'all', // Show both RSS and notes
    singleCategoryFilter: undefined, // No filter by default
};

// Category configurations
export const RSS_CATEGORIES: Record<RSSCategory, RSSCategoryConfig> = {
    pentesting: {
        id: 'pentesting',
        name: 'Penetration Testing',
        icon: 'fa-solid fa-user-secret',
        emoji: '🔒',
        color: '#a1a1aa',
        badgeColor: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
    },
    malware: {
        id: 'malware',
        name: 'Malware Analysis',
        icon: 'fa-solid fa-bug',
        emoji: '🦠',
        color: '#a1a1aa',
        badgeColor: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
    },
    forensics: {
        id: 'forensics',
        name: 'Digital Forensics',
        icon: 'fa-solid fa-magnifying-glass',
        emoji: '🔍',
        color: '#a1a1aa',
        badgeColor: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
    },
    news: {
        id: 'news',
        name: 'Cybersecurity News',
        icon: 'fa-solid fa-newspaper',
        emoji: '📰',
        color: '#a1a1aa',
        badgeColor: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
    },
    dataGov: {
        id: 'dataGov',
        name: 'Data Governance',
        icon: 'fa-solid fa-shield-halved',
        emoji: '🛡️',
        color: '#a1a1aa',
        badgeColor: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
    },
    blockchain: {
        id: 'blockchain',
        name: 'Blockchain & Crypto',
        icon: 'fa-solid fa-link',
        emoji: '⛓️',
        color: '#a1a1aa',
        badgeColor: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
    },
};

// Pre-configured RSS feeds (120 total)
export const DEFAULT_RSS_FEEDS: Omit<RSSFeed, 'id' | 'lastFetched' | 'lastError' | 'itemCount'>[] = [
    // PENETRATION TESTING (20 feeds)
    { name: 'Pen Test Partners', url: 'https://www.pentestpartners.com/feed/', category: 'pentesting', enabled: true },
    { name: 'Reddit NetSec', url: 'https://www.reddit.com/r/netsec/.rss', category: 'pentesting', enabled: true },
    { name: 'PentesterLab Blog', url: 'https://blog.pentesterlab.com/feed', category: 'pentesting', enabled: true },
    { name: 'MDSec', url: 'https://www.mdsec.co.uk/feed/', category: 'pentesting', enabled: true },
    { name: 'SANS ISC', url: 'https://isc.sans.edu/rssfeed.xml', category: 'pentesting', enabled: true },
    { name: 'Rapid7 Blog', url: 'https://blog.rapid7.com/rss/', category: 'pentesting', enabled: true },
    { name: 'Kali Linux', url: 'https://www.kali.org/rss.xml', category: 'pentesting', enabled: true },
    { name: 'Checkpoint Research', url: 'https://research.checkpoint.com/feed/', category: 'pentesting', enabled: true },
    { name: 'Offensive Security', url: 'https://www.offensive-security.com/feed/', category: 'pentesting', enabled: true },
    { name: 'Dark Reading', url: 'https://www.darkreading.com/rss.xml', category: 'pentesting', enabled: true },
    { name: 'The Hacker News', url: 'https://feeds.feedburner.com/TheHackersNews', category: 'pentesting', enabled: true },
    { name: 'Krebs on Security', url: 'https://krebsonsecurity.com/feed/', category: 'pentesting', enabled: true },
    { name: 'Schneier on Security', url: 'https://www.schneier.com/feed/atom/', category: 'pentesting', enabled: true },
    { name: 'ExploitDB', url: 'https://www.exploit-db.com/rss.xml', category: 'pentesting', enabled: true },
    { name: 'Cisco Talos', url: 'https://blog.talosintelligence.com/rss/', category: 'pentesting', enabled: true },
    { name: 'Google Security Blog', url: 'https://security.googleblog.com/feeds/posts/default', category: 'pentesting', enabled: true },
    { name: 'Threatpost', url: 'https://threatpost.com/feed/', category: 'pentesting', enabled: true },
    { name: 'CISA Advisories', url: 'https://www.cisa.gov/cybersecurity-advisories/all.xml', category: 'pentesting', enabled: true },
    { name: 'PortSwigger Research', url: 'https://portswigger.net/research/rss', category: 'pentesting', enabled: false },
    { name: 'HackerOne Hacktivity', url: 'https://hackerone.com/hacktivity.rss', category: 'pentesting', enabled: false },

    // MALWARE ANALYSIS (20 feeds)
    { name: 'MalwareTech', url: 'https://www.malwaretech.com/feed', category: 'malware', enabled: true },
    { name: 'ANY.RUN', url: 'https://any.run/cybersecurity-blog/feed/', category: 'malware', enabled: true },
    { name: 'Malware Traffic Analysis', url: 'https://www.malware-traffic-analysis.net/blog-entries.rss', category: 'malware', enabled: true },
    { name: 'Kaspersky Securelist', url: 'https://securelist.com/feed/', category: 'malware', enabled: true },
    { name: 'Malwarebytes Labs', url: 'https://blog.malwarebytes.com/feed/', category: 'malware', enabled: true },
    { name: 'SentinelOne Labs', url: 'https://www.sentinelone.com/labs/feed/', category: 'malware', enabled: true },
    { name: 'ESET WeLiveSecurity', url: 'https://www.welivesecurity.com/feed/', category: 'malware', enabled: true },
    { name: 'McAfee Labs', url: 'https://www.mcafee.com/blogs/rss/', category: 'malware', enabled: true },
    { name: 'Unit42 Palo Alto', url: 'https://unit42.paloaltonetworks.com/feed/', category: 'malware', enabled: true },
    { name: 'CrowdStrike Blog', url: 'https://www.crowdstrike.com/blog/feed/', category: 'malware', enabled: true },
    { name: 'Google Threat Analysis', url: 'https://blog.google/threat-analysis-group/rss/', category: 'malware', enabled: true },
    { name: 'Zero Day Initiative', url: 'https://www.zerodayinitiative.com/blog?format=rss', category: 'malware', enabled: true },
    { name: 'Threatpost Malware', url: 'https://threatpost.com/category/malware-2/feed/', category: 'malware', enabled: true },
    { name: 'Infosec Institute Malware', url: 'https://resources.infosecinstitute.com/topics/malware-analysis/feed/', category: 'malware', enabled: false },
    { name: 'NVISO Labs', url: 'https://blog.nviso.eu/feed/', category: 'malware', enabled: false },
    { name: 'Malware Patrol', url: 'https://www.malware.news/feed', category: 'malware', enabled: false },
    { name: 'G DATA Malware', url: 'https://www.gdatasoftware.com/blog/feed', category: 'malware', enabled: false },
    { name: 'bin.re', url: 'https://bin.re/feed/', category: 'malware', enabled: false },
    { name: 'CSO Cybercrime', url: 'https://www.csoonline.com/category/cybercrime/feed/', category: 'malware', enabled: false },
    { name: 'URLhaus', url: 'https://urlhaus.abuse.ch/feeds/', category: 'malware', enabled: false },

    // DIGITAL FORENSICS (20 feeds)
    { name: 'Forensic Focus', url: 'https://www.forensicfocus.com/feed/', category: 'forensics', enabled: true },
    { name: 'The DFIR Report', url: 'https://thedfirreport.com/feed/', category: 'forensics', enabled: true },
    { name: 'Huntress Blog', url: 'https://www.huntress.com/blog/rss.xml', category: 'forensics', enabled: true },
    { name: 'CrowdStrike DFIR', url: 'https://www.crowdstrike.com/blog/category/dfir/feed/', category: 'forensics', enabled: true },
    { name: 'Intezer Blog', url: 'https://www.intezer.com/blog/feed/', category: 'forensics', enabled: true },
    { name: 'DFIR Diva', url: 'https://dfirdiva.com/feed/', category: 'forensics', enabled: true },
    { name: 'Ghetto Forensics', url: 'https://www.ghettoforensics.com/feed/', category: 'forensics', enabled: true },
    { name: 'FortiGuard Labs', url: 'https://www.fortiguard.com/rss/ir.xml', category: 'forensics', enabled: true },
    { name: 'Darknet DFIR', url: 'https://www.darknet.org.uk/feed/', category: 'forensics', enabled: true },
    { name: 'Forensic Magazine', url: 'https://www.forensicmag.com/rss/', category: 'forensics', enabled: true },
    { name: 'PagerDuty IR', url: 'https://www.pagerduty.com/blog/category/incident-response/feed/', category: 'forensics', enabled: false },
    { name: 'AWS Security IR', url: 'https://aws.amazon.com/blogs/security/tag/incident-response/feed/', category: 'forensics', enabled: false },
    { name: 'Cisco IR', url: 'https://blogs.cisco.com/tag/incident-response/feed', category: 'forensics', enabled: false },
    { name: 'My DFIR Blog', url: 'https://www.mydfir.com/feed', category: 'forensics', enabled: false },
    { name: 'CIRCL', url: 'https://www.circl.lu/feed/', category: 'forensics', enabled: false },
    { name: 'CSAFE Blog', url: 'https://forensicstats.org/blog/feed/', category: 'forensics', enabled: false },
    { name: 'Windows IR', url: 'https://windowsir.blogspot.com/feeds/posts/default', category: 'forensics', enabled: false },
    { name: 'Another Forensics Blog', url: 'https://az4n6.blogspot.com/feeds/posts/default', category: 'forensics', enabled: false },
    { name: 'williballenthin.com', url: 'https://www.williballenthin.com/feed.xml', category: 'forensics', enabled: false },
    { name: 'incident.io Blog', url: 'https://incident.io/blog/feed', category: 'forensics', enabled: false },

    // CYBERSECURITY NEWS (20 feeds)
    { name: 'The Hacker News', url: 'https://feeds.feedburner.com/TheHackersNews', category: 'news', enabled: true },
    { name: 'Krebs on Security', url: 'https://krebsonsecurity.com/feed/', category: 'news', enabled: true },
    { name: 'Dark Reading', url: 'https://www.darkreading.com/rss.xml', category: 'news', enabled: true },
    { name: 'Threatpost', url: 'https://threatpost.com/feed/', category: 'news', enabled: true },
    { name: 'BleepingComputer', url: 'https://www.bleepingcomputer.com/feed/', category: 'news', enabled: true },
    { name: 'SecurityWeek', url: 'https://www.securityweek.com/feed/', category: 'news', enabled: true },
    { name: 'CSO Online', url: 'https://www.csoonline.com/feed/', category: 'news', enabled: true },
    { name: 'Infosecurity Magazine', url: 'https://www.infosecurity-magazine.com/rss/news/', category: 'news', enabled: true },
    { name: 'SC Magazine', url: 'https://www.scmagazine.com/feed/', category: 'news', enabled: true },
    { name: 'Cyberscoop', url: 'https://www.cyberscoop.com/feed/', category: 'news', enabled: true },
    { name: 'Ars Technica Security', url: 'https://feeds.arstechnica.com/arstechnica/security', category: 'news', enabled: false },
    { name: 'Wired Security', url: 'https://www.wired.com/feed/category/security/latest/rss', category: 'news', enabled: false },
    { name: 'ZDNet Security', url: 'https://www.zdnet.com/topic/security/rss.xml', category: 'news', enabled: false },
    { name: 'TechCrunch Security', url: 'https://techcrunch.com/category/security/feed/', category: 'news', enabled: false },
    { name: 'The Register Security', url: 'https://www.theregister.com/security/headlines.atom', category: 'news', enabled: false },
    { name: 'Graham Cluley', url: 'https://grahamcluley.com/feed/', category: 'news', enabled: false },
    { name: 'Troy Hunt', url: 'https://www.troyhunt.com/rss/', category: 'news', enabled: false },
    { name: 'Bruce Schneier', url: 'https://www.schneier.com/feed/atom/', category: 'news', enabled: false },
    { name: 'Naked Security', url: 'https://nakedsecurity.sophos.com/feed/', category: 'news', enabled: false },
    { name: 'Schneier on Security', url: 'https://www.schneier.com/feed/atom/', category: 'news', enabled: false },

    // DATA GOVERNANCE (20 feeds)
    { name: 'IAPP Daily Dashboard', url: 'https://iapp.org/news/feed/', category: 'dataGov', enabled: true },
    { name: 'Dataversity Data Governance', url: 'https://www.dataversity.net/category/data-topics/data-governance/feed/', category: 'dataGov', enabled: true },
    { name: 'Inside Privacy', url: 'https://www.insideprivacy.com/feed/', category: 'dataGov', enabled: true },
    { name: 'Norton Rose Data Protection', url: 'https://www.dataprotectionreport.com/feed/', category: 'dataGov', enabled: true },
    { name: 'VeraSafe Data Protection', url: 'https://www.verasafe.com/blog/feed/', category: 'dataGov', enabled: true },
    { name: 'Informatica Data Governance', url: 'https://www.informatica.com/blogs/category/data-governance.rss', category: 'dataGov', enabled: true },
    { name: 'Collibra Blog', url: 'https://www.collibra.com/us/en/blog/feed', category: 'dataGov', enabled: true },
    { name: 'EFF Updates', url: 'https://www.eff.org/rss/updates.xml', category: 'dataGov', enabled: true },
    { name: 'Big Brother Watch', url: 'https://bigbrotherwatch.org.uk/feed/', category: 'dataGov', enabled: true },
    { name: 'NOYB', url: 'https://noyb.eu/en/rss.xml', category: 'dataGov', enabled: true },
    { name: 'Nicola Askham Data Governance', url: 'https://www.nicolaaskham.com/feed/', category: 'dataGov', enabled: false },
    { name: 'TechTarget Data Governance', url: 'https://www.techtarget.com/searchdatamanagement/rss/Data-Governance.xml', category: 'dataGov', enabled: false },
    { name: 'Baker McKenzie Data Privacy', url: 'https://www.bakermckenzie.com/en/rss/data-privacy', category: 'dataGov', enabled: false },
    { name: 'VinciWorks Compliance', url: 'https://www.vinciworks.com/blog/feed/', category: 'dataGov', enabled: false },
    { name: 'Smarsh Compliance', url: 'https://www.smarsh.com/blog/feed', category: 'dataGov', enabled: false },
    { name: 'TDAN Data Governance', url: 'http://tdan.com/feed/', category: 'dataGov', enabled: false },
    { name: 'Meru Data', url: 'https://www.merudata.com/feed/', category: 'dataGov', enabled: false },
    { name: 'Precisely Blog', url: 'https://www.precisely.com/blog/feed', category: 'dataGov', enabled: false },
    { name: 'Netwrix Data Governance', url: 'https://www.netwrix.com/blog/feed/', category: 'dataGov', enabled: false },
    { name: 'EDPS News', url: 'https://edps.europa.eu/rss.xml', category: 'dataGov', enabled: false },

    // BLOCKCHAIN & CRYPTO (20 feeds)
    { name: 'Cointelegraph', url: 'https://cointelegraph.com/rss', category: 'blockchain', enabled: true },
    { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', category: 'blockchain', enabled: true },
    { name: 'Bitcoin.com News', url: 'https://news.bitcoin.com/feed/', category: 'blockchain', enabled: true },
    { name: 'CryptoPotato', url: 'https://cryptopotato.com/feed/', category: 'blockchain', enabled: true },
    { name: 'NewsBTC', url: 'https://www.newsbtc.com/feed/', category: 'blockchain', enabled: true },
    { name: 'CryptoBriefing', url: 'https://cryptobriefing.com/feed/', category: 'blockchain', enabled: true },
    { name: 'Crypto.News', url: 'https://crypto.news/feed/', category: 'blockchain', enabled: true },
    { name: 'The Bitcoin News', url: 'https://thebitcoinnews.com/feed/', category: 'blockchain', enabled: true },
    { name: 'CoinJournal', url: 'https://coinjournal.net/feed/', category: 'blockchain', enabled: true },
    { name: 'CryptoSlate', url: 'https://cryptoslate.com/feed/', category: 'blockchain', enabled: true },
    { name: 'Blockchain.News', url: 'https://blockchain.news/rss', category: 'blockchain', enabled: false },
    { name: 'Trustnodes', url: 'https://www.trustnodes.com/feed', category: 'blockchain', enabled: false },
    { name: '99Bitcoins', url: 'https://99bitcoins.com/feed/', category: 'blockchain', enabled: false },
    { name: 'ZyCrypto', url: 'https://zycrypto.com/feed/', category: 'blockchain', enabled: false },
    { name: 'Blockonomi', url: 'https://blockonomi.com/feed/', category: 'blockchain', enabled: false },
    { name: 'CoinSutra', url: 'https://coinsutra.com/feed/', category: 'blockchain', enabled: false },
    { name: 'WazirX Blog', url: 'https://wazirx.com/blog/feed/', category: 'blockchain', enabled: false },
    { name: 'DappRadar', url: 'https://dappradar.com/blog/feed', category: 'blockchain', enabled: false },
    { name: 'Unchained Crypto', url: 'https://unchainedcrypto.com/feed/', category: 'blockchain', enabled: false },
    { name: 'Web3 Enabler', url: 'https://web3enabler.com/feed/', category: 'blockchain', enabled: false },
];
