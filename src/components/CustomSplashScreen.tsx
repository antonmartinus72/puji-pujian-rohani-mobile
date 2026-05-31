import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ImageBackground, Image, View, Text } from 'react-native';

interface CustomSplashScreenProps {
  onAnimationComplete: () => void;
}

export default function CustomSplashScreen({ onAnimationComplete }: CustomSplashScreenProps) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Show splash screen for 1.5 seconds, then fade out over 500ms
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        onAnimationComplete();
      });
    }, 2500);

    return () => clearTimeout(timer);
  }, [opacity, onAnimationComplete]);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity, zIndex: 999 }]}>
      <ImageBackground
        source={require('../../assets/splash_bg.jpg')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.topTextContainer}>
          <Text style={styles.verseText}>
            "Pujilah TUHAN, hai jiwaku! Pujilah nama-Nya yang kudus, hai segenap batinku!"
          </Text>
          <Text style={styles.verseRef}>Mazmur 103:1</Text>
        </View>
        <Image
          source={require('../../assets/splash-icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.textContainer}>
          <Text style={styles.title}>PUJI-PUJIAN ROHANI</Text>
          <Text style={styles.subtitle}>MOBILE</Text>
        </View>
      </ImageBackground>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
  topTextContainer: {
    position: 'absolute',
    top: 70,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  verseText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  verseRef: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  textContainer: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1.5,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f0f0f0',
    letterSpacing: 4,
    textAlign: 'center',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
