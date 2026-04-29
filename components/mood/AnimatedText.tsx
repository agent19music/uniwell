import React from "react";
import { StyleProp, StyleSheet, TextStyle } from "react-native";
import Animated, {
  LinearTransition,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const damping = 18;
const stiffness = 200;
const mass = 1;
const duration = 300;
const delayGap = 15;

const springConfig = {
  damping,
  stiffness,
  mass,
};

const timingConfig = {
  duration,
};

interface AnimatedTextProps {
  text: string;
  style?: StyleProp<TextStyle>;
}

export const AnimatedText = ({ text, style }: AnimatedTextProps) => {
  const chars = Array.from(text);
  return (
    <Animated.View
      style={styles.container}
      layout={LinearTransition.springify()
        .damping(damping)
        .stiffness(stiffness)
        .mass(mass)}
    >
      {chars.map((char, index) => (
        <AnimatedChar
          key={`${char}-${index}`}
          char={char}
          style={style}
          index={index}
        />
      ))}
    </Animated.View>
  );
};

interface AnimatedCharProps {
  char: string;
  style?: StyleProp<TextStyle>;
  index: number;
}

const AnimatedChar = ({ char, style, index: mainIndex }: AnimatedCharProps) => {
  const index = mainIndex + 1;
  const delay = index * delayGap;

  const customEntering = () => {
    "worklet";
    const animations = {
      opacity: withDelay(delay, withTiming(1, timingConfig)),
      transform: [
        {
          translateY: withDelay(delay, withSpring(0, springConfig)),
        },
        {
          scale: withDelay(delay, withTiming(1, timingConfig)),
        },
      ],
    };
    const initialValues = {
      opacity: 0,
      transform: [{ translateY: -15 }, { scale: 0.5 }],
    };
    return {
      initialValues,
      animations,
    };
  };

  const customExiting = () => {
    "worklet";
    const animations = {
      opacity: withDelay(delay, withTiming(0, timingConfig)),
      transform: [
        { translateY: withDelay(delay, withSpring(15, springConfig)) },
        {
          scale: withDelay(delay, withTiming(0.5, timingConfig)),
        },
      ],
    };
    const initialValues = {
      opacity: 1,
      transform: [{ translateY: 0 }, { scale: 1 }],
    };
    return {
      initialValues,
      animations,
    };
  };

  return (
    <Animated.Text
      entering={customEntering}
      exiting={customExiting}
      layout={LinearTransition.springify()
        .damping(damping)
        .stiffness(stiffness)
        .mass(mass)}
      style={style}
    >
      {char}
    </Animated.Text>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
});
