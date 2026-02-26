export enum View {
  DASHBOARD = 'DASHBOARD',
  ANALYTICS = 'ANALYTICS',
  CALENDAR = 'CALENDAR',
  CREATE_POST = 'CREATE_POST',
  MEDIA_LIBRARY = 'MEDIA_LIBRARY',
  INBOX = 'INBOX',
  SETTINGS = 'SETTINGS'
}

export interface NavItem {
  id: View;
  label: string;
  icon: React.ReactNode;
}

export interface ViewProps {
  onNavigate: (view: View) => void;
}

export interface Post {
  id: string;
  platform: 'instagram' | 'tiktok' | 'facebook' | 'youtube' | 'linkedin' | 'x';
  content: string;
  image?: string;
  date: Date;
  status: 'scheduled' | 'published' | 'draft';
  stats?: {
    likes: number;
    views: number;
  };
}

export interface Message {
  id: string;
  sender: string;
  avatar: string;
  text: string;
  timestamp: string;
  isMe: boolean;
}

export interface Conversation {
  id: string;
  platform: 'instagram' | 'facebook' | 'x';
  user: string;
  avatar: string;
  lastMessage: string;
  unread: boolean;
  status: 'new' | 'pending' | 'resolved';
  messages: Message[];
}

export enum Platform {
  INSTAGRAM = 'instagram',
  TIKTOK = 'tiktok',
  FACEBOOK = 'facebook',
  YOUTUBE = 'youtube',
  LINKEDIN = 'linkedin',
  X = 'x'
}

export enum TransactionStatus {
  PENDING = 'pending',
  SIGNING = 'signing',
  SUBMITTED = 'submitted',
  CONFIRMED = 'confirmed',
  FAILED = 'failed'
}

export enum TransactionType {
  PAYMENT = 'payment',
  TOKEN_MINT = 'token_mint',
  NFT_MINT = 'nft_mint',
  SMART_CONTRACT = 'smart_contract',
  TRUSTLINE = 'trustline'
}

export interface Transaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  description: string;
  amount?: string;
  asset?: string;
  recipient?: string;
  timestamp: number;
  hash?: string;
  error?: string;
  requiresSignature: boolean;
  signatures?: string[];
  requiredSignatures?: number;
}

export interface NotificationPreferences {
  enabled: boolean;
  sound: boolean;
  soundType: 'default' | 'subtle' | 'alert';
  grouping: boolean;
  showOnNewItem: boolean;
  showOnSignature: boolean;
  showOnConfirmation: boolean;
}
