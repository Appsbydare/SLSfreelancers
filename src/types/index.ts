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
