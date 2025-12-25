import { CategoryGroup } from '@/types';

export const categoryGroups: CategoryGroup[] = [
  {
    id: 'trending',
    label: 'Trending',
    icon: '🔥',
    sections: [
      {
        title: 'Popular Right Now',
        items: [
          { label: 'Logo Design', badge: 'hot' },
          { label: 'UX Research' },
          { label: '2D Animation' },
          { label: 'WordPress Speed Optimization' },
          { label: 'Meta Ads Strategy' },
        ],
      },
      {
        title: 'Top Skills for 2024',
        items: [
          { label: 'AI Prompt Engineering', badge: 'new' },
          { label: 'Notion Consulting' },
          { label: 'AR Filters' },
          { label: 'Vertical Video Editing', badge: 'hot' },
          { label: 'Shopify Migration' },
        ],
      },
    ],
  },
  {
    id: 'graphics-design',
    label: 'Graphics & Design',
    icon: '🎨',
    sections: [
      {
        title: 'Logo & Brand Identity',
        items: [
          { label: 'Logo Design' },
          { label: 'Brand Style Guides' },
          { label: 'Business Cards & Stationery' },
          { label: 'Fonts & Typography' },
          { label: 'Art Direction', badge: 'new' },
          { label: 'Logo Maker Tool' },
        ],
      },
      {
        title: 'Art & Illustration',
        items: [
          { label: 'Illustration' },
          { label: 'AI Artists' },
          { label: 'AI Avatar Design', badge: 'new' },
          { label: 'Portraits & Caricatures' },
          { label: 'Comic Illustration', badge: 'new' },
        ],
      },
      {
        title: 'Web & App Design',
        items: [
          { label: 'Website Design' },
          { label: 'App Design' },
          { label: 'UX Design' },
          { label: 'Landing Page Design' },
          { label: 'Icon Design' },
        ],
      },
      {
        title: 'Product & Gaming',
        items: [
          { label: 'Industrial & Product Design' },
          { label: 'Character Modeling' },
          { label: 'Game Art' },
          { label: 'Graphics for Streamers' },
        ],
      },
      {
        title: 'Print Design',
        items: [
          { label: 'Brochure Design' },
          { label: 'Flyer Design' },
          { label: 'Menu Design' },
          { label: 'Invitation Design' },
        ],
      },
      {
        title: 'Visual & 3D',
        items: [
          { label: 'Image Editing' },
          { label: 'AI Image Editing', badge: 'new' },
          { label: 'Presentation Design' },
          { label: '3D Architecture' },
          { label: '3D Fashion & Garment' },
        ],
      },
    ],
  },
  {
    id: 'programming-tech',
    label: 'Programming & Tech',
    icon: '💻',
    sections: [
      {
        title: 'Development',
        items: [
          { label: 'Full-Stack Websites' },
          { label: 'Web Apps' },
          { label: 'Mobile Apps' },
          { label: 'Desktop Applications' },
        ],
      },
      {
        title: 'AI & Data',
        items: [
          { label: 'AI Chatbots' },
          { label: 'Machine Learning Models' },
          { label: 'Automation Scripts' },
          { label: 'Data Visualization' },
        ],
      },
      {
        title: 'Support',
        items: [
          { label: 'QA & Testing' },
          { label: 'DevOps & Cloud' },
          { label: 'Cybersecurity' },
          { label: 'Tech Support' },
        ],
      },
    ],
  },
  {
    id: 'digital-marketing',
    label: 'Digital Marketing',
    icon: '📣',
    sections: [
      {
        title: 'Social & Community',
        items: [
          { label: 'Social Media Strategy' },
          { label: 'Community Management' },
          { label: 'Influencer Marketing' },
          { label: 'TikTok Campaigns', badge: 'hot' },
        ],
      },
      {
        title: 'Acquisition',
        items: [
          { label: 'SEO' },
          { label: 'Paid Search' },
          { label: 'Meta Ads' },
          { label: 'Email Marketing' },
        ],
      },
      {
        title: 'Content',
        items: [
          { label: 'Blog Content Strategy' },
          { label: 'Newsletter Creation' },
          { label: 'Case Studies' },
          { label: 'Product Descriptions' },
        ],
      },
    ],
  },
  {
    id: 'writing-translation',
    label: 'Writing & Translation',
    icon: '✍️',
    sections: [
      {
        title: 'Business Writing',
        items: [
          { label: 'Pitch Deck Copy' },
          { label: 'Business Plans' },
          { label: 'Grant Writing' },
          { label: 'UX Writing' },
        ],
      },
      {
        title: 'Creative',
        items: [
          { label: 'Website Copy' },
          { label: 'Sales Letters' },
          { label: 'Podcast Scripts' },
          { label: 'Video Scripts' },
        ],
      },
      {
        title: 'Translation',
        items: [
          { label: 'English to Sinhala' },
          { label: 'English to Tamil' },
          { label: 'Sinhala to Tamil' },
          { label: 'Technical Localization' },
        ],
      },
    ],
  },
  {
    id: 'video-animation',
    label: 'Video & Animation',
    icon: '🎬',
    sections: [
      {
        title: 'Video Production',
        items: [
          { label: 'Explainer Videos' },
          { label: 'Product Videos' },
          { label: 'Testimonial Videos' },
          { label: 'Course Videos' },
        ],
      },
      {
        title: 'Animation',
        items: [
          { label: '2D Animation' },
          { label: '3D Animation' },
          { label: 'Motion Graphics' },
          { label: 'Logo Animation' },
        ],
      },
      {
        title: 'Editing',
        items: [
          { label: 'YouTube Editing' },
          { label: 'Vertical Video Editing', badge: 'hot' },
          { label: 'Color Grading' },
          { label: 'Sound Design' },
        ],
      },
    ],
  },
  {
    id: 'music-audio',
    label: 'Music & Audio',
    icon: '🎧',
    sections: [
      {
        title: 'Production',
        items: [
          { label: 'Custom Jingles' },
          { label: 'Podcast Editing' },
          { label: 'Mixing & Mastering' },
          { label: 'Sound Effects' },
        ],
      },
      {
        title: 'Voice',
        items: [
          { label: 'Voice Over (English)' },
          { label: 'Voice Over (Sinhala)' },
          { label: 'Voice Over (Tamil)' },
          { label: 'Narration & Audiobooks' },
        ],
      },
      {
        title: 'Consulting',
        items: [
          { label: 'Music Distribution' },
          { label: 'Live Events' },
          { label: 'Studio Setup' },
        ],
      },
    ],
  },
  {
    id: 'business',
    label: 'Business',
    icon: '💼',
    sections: [
      {
        title: 'Operations',
        items: [
          { label: 'Virtual Assistance' },
          { label: 'Project Management' },
          { label: 'CRM Implementation' },
          { label: 'Process Automation' },
        ],
      },
      {
        title: 'Finance & Legal',
        items: [
          { label: 'Bookkeeping' },
          { label: 'Financial Modeling' },
          { label: 'Legal Consulting' },
          { label: 'Contract Drafting' },
        ],
      },
      {
        title: 'HR & Training',
        items: [
          { label: 'Recruitment' },
          { label: 'Employee Onboarding' },
          { label: 'Sales Training' },
          { label: 'Leadership Coaching' },
        ],
      },
    ],
  },
];



