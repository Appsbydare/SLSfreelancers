export interface Task {
  id: string;
  title: string;
  description: string;
  budget: number;
  location: string;
  category: string;
  postedDate: Date;
  deadline?: Date;
  images?: string[];
  posterId: string;
  posterName: string;
  posterRating: number;
  offersCount: number;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
}

export interface Category {
  id: string;
  name: string;
  nameSi: string;
  nameTa: string;
  icon: string;
  description: string;
  popular: boolean;
}

export interface CategoryMenuItem {
  label: string;
  badge?: 'new' | 'hot';
}

export interface CategoryMenuSection {
  title: string;
  items: CategoryMenuItem[];
}

export interface CategoryGroup {
  id: string;
  label: string;
  icon?: string;
  description?: string;
  sections: CategoryMenuSection[];
}

export interface Tasker {
  id: string;
  name: string;
  rating: number;
  completedTasks: number;
  responseTime: string;
  specialties: string[];
  location: string;
  profileImage?: string;
  verified: boolean;
  badges: string[];
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

// Gig System Types (Fiverr Model)
export interface Gig {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar?: string;
  sellerLevel: string;
  sellerRating?: number;
  title: string;
  slug: string;
  description: string;
  category: string;
  subcategory?: string;
  tags: string[];
  images: string[];
  status: 'draft' | 'active' | 'paused' | 'rejected';
  deliveryType: 'digital' | 'physical' | 'service';
  startingPrice: number;
  rating: number;
  reviewsCount: number;
  ordersCount: number;
  viewsCount: number;
  isFeatured?: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface GigPackage {
  id: string;
  gigId: string;
  tier: 'basic' | 'standard' | 'premium';
  name: string;
  description?: string;
  price: number;
  deliveryDays: number;
  revisions: number | null; // null = unlimited
  features: string[];
  createdAt?: Date;
}

export interface GigRequirement {
  id: string;
  gigId: string;
  question: string;
  answerType: 'text' | 'choice' | 'file' | 'multiple_choice';
  options?: string[];
  isRequired: boolean;
  sortOrder?: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName?: string;
  sellerId: string;
  sellerName?: string;
  gigId?: string;
  gigTitle?: string;
  gigImage?: string;
  packageId?: string;
  packageTier?: 'basic' | 'standard' | 'premium';
  totalAmount: number;
  platformFee: number;
  sellerEarnings: number;
  status: 'pending' | 'in_progress' | 'delivered' | 'revision_requested' | 'completed' | 'cancelled' | 'disputed';
  requirementsResponse?: Record<string, any>;
  deliveryDate?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface OrderDelivery {
  id: string;
  orderId: string;
  message?: string;
  attachments: string[];
  deliveredAt: Date;
}

export interface OrderRevision {
  id: string;
  orderId: string;
  requestedBy: string;
  requestedByName?: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

export interface GigFavorite {
  id: string;
  userId: string;
  gigId: string;
  createdAt: Date;
}
