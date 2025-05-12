import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

interface FooterLinkProps {
  title: string;
  onPress: () => void;
}

const FooterLink: React.FC<FooterLinkProps> = ({ title, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.linkContainer}>
      <Text style={styles.linkText}>{title}</Text>
    </TouchableOpacity>
  );
};

interface FooterSectionProps {
  title: string;
  links: Array<{
    title: string;
    onPress: () => void;
  }>;
}

const FooterSection: React.FC<FooterSectionProps> = ({ title, links }) => {
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {links.map((link, index) => (
        <FooterLink key={index} title={link.title} onPress={link.onPress} />
      ))}
    </View>
  );
};

const Footer: React.FC = () => {
  const aboutLinks = [
    { title: 'Principles', onPress: () => console.log('Principles pressed') },
    { title: 'The Team', onPress: () => console.log('The Team pressed') },
    { title: 'Roadmap', onPress: () => console.log('Roadmap pressed') },
    { title: 'Building', onPress: () => console.log('Building pressed') },
    { title: 'Testimonials', onPress: () => console.log('Testimonials pressed') },
  ];

  const productLinks = [
    { title: 'Features', onPress: () => console.log('Features pressed') },
    { title: 'Use cases', onPress: () => console.log('Use cases pressed') },
    { title: 'Creators', onPress: () => console.log('Creators pressed') },
    { title: 'The future', onPress: () => console.log('The future pressed') },
  ];

  const legalLinks = [
    { title: 'Privacy', onPress: () => console.log('Privacy pressed') },
    { title: 'Terms', onPress: () => console.log('Terms pressed') },
    { title: 'Cookies', onPress: () => console.log('Cookies pressed') },
    { title: 'Legal Info', onPress: () => console.log('Legal Info pressed') },
  ];

  const socialLinks = [
    { title: 'Instagram', onPress: () => console.log('Instagram pressed') },
    { title: 'Discord', onPress: () => console.log('Discord pressed') },
    { title: 'X (Twitter)', onPress: () => console.log('X (Twitter) pressed') },
  ];

  return (
    <View style={styles.container}>
      <ScrollView horizontal={false} style={styles.footerContent}>
        <View style={styles.sectionsContainer}>
          <FooterSection title="About" links={aboutLinks} />
          <FooterSection title="Product" links={productLinks} />
          <FooterSection title="Legal" links={legalLinks} />
          <FooterSection title="Social" links={socialLinks} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#171717',
    paddingVertical: 40,
    paddingHorizontal: 16,
    width: '100%',
    borderRadius: 20,
  },
  footerContent: {
    width: '80%',
    alignSelf: 'center',
  },
  sectionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  sectionContainer: {
    marginBottom: 24,
    minWidth: 150,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  linkContainer: {
    marginBottom: 12,
  },
  linkText: {
    color: '#AAAAAA',
    fontSize: 14,
    fontFamily: 'SF-Regular',
  },
});

export default Footer;