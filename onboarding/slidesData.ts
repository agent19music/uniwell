import { OnboardingSlide } from './types';

export const onboardingSlides: OnboardingSlide[] = [
  {
    id: 'productivity',
    title: 'Boost Your Productivity',
    description: 'Stay on track with study timers, focus sessions, and goal tracking tools designed specifically for students.',
    imageSource: require('../assets/mesh-99.png'),
    backgroundColor: '#E6F3FF',
    icon: 'TaskDone01Icon',
  },
  {
    id: 'professional',
    title: 'Professional Support',
    description: 'Book counseling appointments, browse mental health resources, and access crisis support when you need it most.',
    imageSource: require('../assets/mesh-188.png'),
    backgroundColor: '#FFF1E6',
    icon: 'HealtCareIcon',
  },
  {
    id: 'community',
    title: 'Join the Community',
    description: 'Connect with peers through discussion forums, group activities, and anonymous sharing in a supportive environment.',
    imageSource: require('../assets/mesh-611.png'),
    backgroundColor: '#E6FFE9',
    icon: 'MessageMultiple01Icon',

  },
  {
    id: 'resources',
    title: 'Self-Help Resources',
    description: 'Access guided meditations, mindfulness exercises, and evidence-based tools to manage stress and improve sleep.',
    imageSource: require('../assets/mesh-532.png'),
    backgroundColor: '#F8E6FF',
    icon: 'BookOpen02Icon',
  },
];

