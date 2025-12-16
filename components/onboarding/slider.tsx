import React, { useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";
import Wave, { WaveChildProps } from "./wave";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { HEIGHT, MARGIN_WIDTH, MIN_LEDGE, Side, WIDTH } from "@/configs/constants";

const PREV = WIDTH;
const NEXT = 0;
const LEFT_SNAP_POINTS = [MARGIN_WIDTH, PREV];
const RIGHT_SNAP_POINTS = [NEXT, WIDTH - MARGIN_WIDTH];

interface SliderProps {
    index: number;
    setIndex: (value: number) => void;
    children: React.ReactElement<WaveChildProps>;
    prev?: React.ReactElement<WaveChildProps>;
    next?: React.ReactElement<WaveChildProps>;
}

const Slider = ({ index, children: current, prev, next, setIndex }: SliderProps) => {
    const hasPrev = !!prev;
    const hasNext = !!next;

    const zIndex = useSharedValue(0);
    const activeSide = useSharedValue(Side.NONE);
    const isTransitionLeft = useSharedValue(false);
    const isTransitionRight = useSharedValue(false);

    const left = { x: useSharedValue(MIN_LEDGE), y: useSharedValue(HEIGHT / 2) };
    const right = { x: useSharedValue(MIN_LEDGE), y: useSharedValue(HEIGHT / 2) };

    const snapPoint = (value: number, velocity: number, points: number[]) => {
        "worklet";
        let closest = points[0];
        let minDist = Math.abs(value - closest);
        for (let i = 1; i < points.length; i++) {
            const dist = Math.abs(value - points[i]);
            if (dist < minDist) {
                minDist = dist;
                closest = points[i];
            }
        }
        if (velocity > 500) closest = points[points.length - 1];
        if (velocity < -500) closest = points[0];
        return closest;
    };

    const panGesture = Gesture.Pan()
        .onStart(({ x }) => {
            if (x <= MARGIN_WIDTH && hasPrev) {
                activeSide.value = Side.LEFT;
                zIndex.value = 100;
            } else if (x >= WIDTH - MARGIN_WIDTH && hasNext) {
                activeSide.value = Side.RIGHT;
            } else {
                activeSide.value = Side.NONE;
            }
        })
        .onUpdate(({ x, y }) => {
            if (activeSide.value === Side.LEFT) {
                left.x.value = Math.max(x, MARGIN_WIDTH);
                left.y.value = y;
            } else if (activeSide.value === Side.RIGHT) {
                right.x.value = Math.max(WIDTH - x, MARGIN_WIDTH);
                right.y.value = y;
            }
        })
        .onEnd(({ x, velocityX, velocityY }) => {
            if (activeSide.value === Side.LEFT) {
                const dest = snapPoint(x, velocityX, LEFT_SNAP_POINTS);
                isTransitionLeft.value = dest === PREV;
                left.x.value = withSpring(
                    dest,
                    {
                        velocity: velocityX,
                        overshootClamping: isTransitionLeft.value ? true : false,
                        energyThreshold: isTransitionLeft.value ? 100 : 1e-5,
                    },
                    () => {
                        if (isTransitionLeft.value) {
                            runOnJS(setIndex)(index - 1);
                        } else {
                            zIndex.value = 0;
                            activeSide.value = Side.NONE;
                        }
                    },
                );
                left.y.value = withSpring(HEIGHT / 2, { velocity: velocityY });
            } else if (activeSide.value === Side.RIGHT) {
                const dest = snapPoint(x, velocityX, RIGHT_SNAP_POINTS);
                isTransitionRight.value = dest === NEXT;
                right.x.value = withSpring(
                    WIDTH - dest,
                    {
                        velocity: velocityX,
                        overshootClamping: isTransitionRight.value ? true : false,
                        energyThreshold: isTransitionRight.value ? 100 : 1e-5, // Same v4 fix
                    },
                    () => {
                        if (isTransitionRight.value) {
                            runOnJS(setIndex)(index + 1);
                        } else {
                            activeSide.value = Side.NONE;
                        }
                    },
                );
                right.y.value = withSpring(HEIGHT / 2, { velocity: velocityY });
            }
        });

    const leftStyle = useAnimatedStyle(() => ({
        zIndex: zIndex.value,
    }));

    useEffect(() => {
        if (Platform.OS === "ios") {
            right.x.value = withSpring(WIDTH * 0.167);
        } else {
            right.x.value = withSpring(WIDTH * 0.185);
        }
    }, []);

    return (
        <GestureDetector gesture={panGesture}>
            <Animated.View style={StyleSheet.absoluteFill}>
                {current}
                {prev && (
                    <Animated.View style={[StyleSheet.absoluteFill, leftStyle]}>
                        <Wave side={Side.LEFT} position={left} isTransitioning={isTransitionLeft}>
                            {prev}
                        </Wave>
                    </Animated.View>
                )}
                {next && (
                    <View style={StyleSheet.absoluteFill}>
                        <Wave side={Side.RIGHT} position={right} isTransitioning={isTransitionRight}>
                            {next}
                        </Wave>
                    </View>
                )}
            </Animated.View>
        </GestureDetector>
    );
};

export default Slider;
