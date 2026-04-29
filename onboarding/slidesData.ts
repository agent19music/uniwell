import { OnboardingSlide } from './types';

export const onboardingSlides: OnboardingSlide[] = [
  {
    id: 'mood',
    title: 'Track Your Mood',
    description: 'Daily check-ins help you understand your emotional patterns and build self-awareness over time.',
    imageSource: require('../assets/mesh-99.png'),
    backgroundColor: '#E6F3FF',
    icon: 'HeartIcon',
  },
  {
    id: 'habits',
    title: 'Build Healthy Habits',
    description: 'Create routines, maintain streaks, and set wellness goals designed for your student lifestyle.',
    imageSource: require('../assets/mesh-188.png'),
    backgroundColor: '#FFF1E6',
    icon: 'TaskDone01Icon',
  },
  {
    id: 'journal',
    title: 'Journal Your Thoughts',
    description: 'Express yourself through text, voice, or video journaling in a private, secure space.',
    imageSource: require('../assets/mesh-611.png'),
    backgroundColor: '#E6FFE9',
    icon: 'BookOpen02Icon',
  },
  {
    id: 'resources',
    title: 'Access Support',
    description: 'Guided meditations, mindfulness exercises, and evidence-based tools whenever you need them.',
    imageSource: require('../assets/mesh-532.png'),
    backgroundColor: '#F8E6FF',
    icon: 'HealtCareIcon',
  },
];
