import { View, Text, Pressable, StyleSheet, ScrollView, Platform } from "react-native";
import React, { useEffect, useMemo, useState } from "react";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { scale, verticalScale } from "react-native-size-matters";
import { useTheme } from "@/context/theme.context";
import { Entypo, Feather, FontAwesome5 } from "@expo/vector-icons";
import { fontSizes } from "@/themes/app.constant";
import CircularProgress from "react-native-circular-progress-indicator";
import * as SecureStore from "expo-secure-store";
import { setAuthorizationHeader } from "@/hooks/fetch/useUser";
import axios from "axios";

export default function BottomCourseAccess({
  bottomSheetRef,
  courseData,
  courseContent,
  setActiveVideo,
  activeVideo,
}: {
  bottomSheetRef: any;
  courseData: any;
  courseContent: CourseDataType[];
  activeVideo: number;
  setActiveVideo: (video: number) => void;
}) {
  const { theme } = useTheme();
  const [videoCompleteHistory, setVideoCompleteHistory] = useState<any>([]);
  const videoSections: string[] = [
    ...new Set<string>(
      courseContent.map((item: CourseDataType) => item.videoSection)
    ),
  ];

  useEffect(() => {
    const fetch = async () => {
      await setAuthorizationHeader();
      await axios
        .get(`${process.env.EXPO_PUBLIC_SERVER_URI}/video-complete-history`)
        .then((res) => {
          setVideoCompleteHistory(res.data.videos);
        });
    };
    fetch();
  }, []);

  const snapPoints = useMemo(() => ["12.7%", "100%"], []);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      style={{ marginTop: verticalScale(32) }}
      backgroundStyle={{
        backgroundColor: theme.dark ? "#1e1e1e" : "#f5f5f5",
      }}
      handleIndicatorStyle={{
        backgroundColor: !theme.dark ? "#1e1e1e" : "#f5f5f5",
      }}
    >
      <BottomSheetView
        style={{
          flex: Platform.OS === "android" ? 0 : 1,
          backgroundColor: theme.dark ? "#1e1e1e" : "#f5f5f5",
        }}
      >
        <Pressable
          style={{
            flexDirection: "row",
            gap: scale(10),
            paddingHorizontal: scale(25),
          }}
          onPress={() => bottomSheetRef.current?.snapToIndex(1)}
        >
          <Feather
            name="list"
            size={scale(20)}
            color={theme.dark ? "#fff" : "#333"}
          />
          <Text
            style={[
              styles.baseText,
              {
                fontSize: fontSizes.FONT21,
                textAlign: "left",

                color: theme.dark ? "#fff" : "#333",
              },
            ]}
          >
            Table of Lessons
          </Text>
        </Pressable>
        <ScrollView
          style={{
            marginTop: verticalScale(10),
            marginBottom: verticalScale(60),
          }}
        >
          {videoSections?.map((item: string, index: number) => {
            const sectionVideos: any[] = courseContent?.filter(
              (i: any) => i.videoSection === item
            );
            return (
              <>
                <View key={index}>
                  <View
                    style={{
                      padding: scale(10),
                      flexDirection: "row",
                      gap: scale(8),
                    }}
                  >
                    <View>
                      <CircularProgress
                        value={100}
                        radius={scale(18)}
                        activeStrokeWidth={6}
                        activeStrokeColor={"#705DF2"}
                      />
                    </View>
                    <View
                      style={{
                        marginRight: scale(20),
                      }}
                    >
                      <Text
                        style={[
                          styles.baseText,
                          {
                            textAlign: "left",
                            fontSize: fontSizes.FONT17,
                            color: theme.dark ? "#fff" : "#111",
                          },
                        ]}
                      >
                        Section {index < 9 ? "0" + (index + 1) : index + 1}
                      </Text>
                      <Text
                        style={[
                          styles.baseText,
                          {
                            textAlign: "left",
                            color: "#705DF2",
                            fontSize: fontSizes.FONT18,
                          },
                        ]}
                      >
                        {item}
                      </Text>
                    </View>
                  </View>
                  {sectionVideos.map((video: CourseDataType, index: number) => {
                    const handleActiveVideo = async ({
                      title,
                      contentId,
                    }: {
                      title: string;
                      contentId: string;
                    }) => {
                      const activeVideoIndex = courseContent.findIndex(
                        (v: any) => v.title === title
                      );
                      setActiveVideo(activeVideoIndex);
                      bottomSheetRef.current?.snapToIndex(0);
                      await SecureStore.setItemAsync(
                        courseData.id,
                        JSON.stringify(activeVideoIndex)
                      );
                      if (
                        !videoCompleteHistory.find(
                          (i: any) => i.contentId === contentId
                        )
                      ) {
                        await setAuthorizationHeader();
                        await axios
                          .post(
                            `${process.env.EXPO_PUBLIC_SERVER_URI}/add-video-complete-history`,
                            {
                              contentId,
                            }
                          )
                          .then((res) => {
                            setVideoCompleteHistory((prevHistory: any) => [
                              ...prevHistory,
                              res.data.video,
                            ]);
                          });
                      }
                    };

                    const hasCompleted = videoCompleteHistory.find(
                      (i: any) => i.contentId === video.id
                    );

                    const formatVideoLength = (videoLength: string) => {
                      const totalMinutes = parseInt(videoLength, 10); // Convert to integer if needed
                      const hours = Math.floor(totalMinutes / 60);
                      const minutes = totalMinutes % 60;

                      // Build the output string dynamically
                      let result = "";
                      if (hours > 0) {
                        result += `${hours} ${hours === 1 ? "hour" : "hours"}`;
                      }
                      if (minutes > 0) {
                        result += ` ${minutes} ${
                          minutes === 1 ? "minute" : "minutes"
                        }`;
                      }

                      return result.trim();
                    };

                    return (
                      <Pressable
                        style={{
                          margin: verticalScale(5),
                          overflow: "hidden",
                          flexDirection: "row",
                          gap: scale(10),
                          alignItems: "center",
                          padding: scale(10),
                          borderRadius: scale(10),
                          backgroundColor:
                            courseContent[activeVideo].title === video.title
                              ? theme.dark
                                ? "#191919"
                                : "#f1f1f1"
                              : "transparent",
                        }}
                        key={index}
                        onPress={() =>
                          handleActiveVideo({
                            title: video.title,
                            contentId: courseContent[activeVideo].id,
                          })
                        }
                      >
                        {courseContent[activeVideo].title === video.title ? (
                          <View
                            style={{
                              width: scale(22),
                              height: scale(22),
                              borderRadius: scale(40),
                              backgroundColor: "#33FECE",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <Entypo
                              name="controller-play"
                              size={scale(18)}
                              color={!theme.dark ? "#fff" : "#111"}
                            />
                          </View>
                        ) : (
                          <View
                            style={{
                              width: scale(22),
                              height: scale(22),
                              borderRadius: scale(40),
                              backgroundColor: hasCompleted
                                ? "#33FECE"
                                : "transparent",
                              borderWidth: hasCompleted ? 0 : 2,
                              borderColor: "#33FECE",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            {hasCompleted && (
                              <FontAwesome5
                                name="check"
                                size={scale(10)}
                                color={!theme.dark ? "#fff" : "#111"}
                              />
                            )}
                          </View>
                        )}
                        <View style={{ marginRight: scale(18) }}>
                          <Text
                            style={[
                              styles.baseText,
                              {
                                fontSize: fontSizes.FONT16,
                                textAlign: "left",
                                color: theme.dark ? "#fff" : "#111",
                              },
                            ]}
                          >
                            {index < 9 && "0"}
                            {index + 1}. {video.title}
                          </Text>
                          <Text
                            style={[
                              styles.baseText,
                              {
                                fontSize: fontSizes.FONT14,
                                textAlign: "left",
                                fontWeight: "400",
                                opacity: 0.8,
                                paddingTop: verticalScale(2),
                                color: theme.dark ? "#fff" : "#111",
                              },
                            ]}
                          >
                            {formatVideoLength(video.videoLength)}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            );
          })}
        </ScrollView>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  baseText: {
    color: "#fff",
    textAlign: "center",
    fontSize: fontSizes.FONT24,
    fontWeight: "600",
  },
  button: {
    width: scale(100),
    height: verticalScale(35),
    backgroundColor: "#2467EC",
    marginVertical: verticalScale(8),
    borderRadius: scale(20),
    alignItems: "center",
    justifyContent: "center",
  },
});
