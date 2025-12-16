import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  TextInput,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "@/context/theme.context";
import { useGlobalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";
import {
  fontSizes,
  IsIPAD,
  windowHeight,
  windowWidth,
} from "@/themes/app.constant";
import {
  AntDesign,
  FontAwesome,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { WIDTH } from "@/configs/constants";
import axios from "axios";
import { setAuthorizationHeader } from "@/hooks/fetch/useUser";
import { MotiView } from "moti";
import { Skeleton } from "moti/skeleton";
import { Spacer } from "@/utils/skelton";
import QuestionCard from "@/components/cards/question.card";
import ReviewCard from "@/components/cards/review.card";
import BottomCourseAccess from "@/components/course/bottom.course.access";
import { WebView } from "react-native-webview";

export default function CourseAccessScreen() {
  const { theme } = useTheme();
  const params: any = useGlobalSearchParams();
  const courseContents: CourseDataType[] = JSON.parse(params?.courseContent);
  const [activeVideo, setActiveVideo] = useState(0);
  const [activeButton, setActiveButton] = useState("Overview");
  const [question, setQuestion] = useState("");
  const [questionsLoader, setQuestionsLoader] = useState(true);
  const [reviews, setReviews] = useState<ReviewsType[]>([]);
  const [reviewsLoader, setreviewsLoader] = useState(false);
  const [review, setReview] = useState("");
  const [questions, setQuestions] = useState<QuestionType[]>([]);
  const [rating, setRating] = useState(1);
  const [videoCompleteHistory, setvideoCompleteHistory] = useState([]);
  const bottomSheetRef = useRef(null);

  useEffect(() => {
    const gettingLastHistory = async () => {
      if (params?.activeVideo) {
        //
      } else {
        const lastSession = await SecureStore.getItemAsync(params?.id);
        if (lastSession) {
          setActiveVideo(parseInt(lastSession));
        } else {
          setActiveVideo(0);
        }
      }
    };
    gettingLastHistory();
  }, []);

  const handlePrevLesson = async () => {
    setActiveVideo(activeVideo !== 0 ? activeVideo - 1 : 0);
    await SecureStore.setItemAsync(
      params.id,
      JSON.stringify(activeVideo !== 0 ? activeVideo - 1 : 0)
    );
  };

  const handleNextLesson = async ({ contentId }: { contentId: string }) => {
    setActiveVideo(
      activeVideo === courseContents.length
        ? courseContents.length
        : activeVideo + 1
    );
    await SecureStore.setItemAsync(params.id, JSON.stringify(activeVideo + 1));
  };

  const questionsFetchHandler = async () => {
    await setAuthorizationHeader();
    const response = await axios.get(
      `${process.env.EXPO_PUBLIC_SERVER_URI}/get-questions/${courseContents[activeVideo].id}`
    );
    setQuestions(response.data.questions);
    setQuestionsLoader(false);
  };

  const reviewsFetchHandler = async () => {
    try {
      await axios
        .get(`${process.env.EXPO_PUBLIC_SERVER_URI}/get-reviews/${params.id}`)
        .then((res) => {
          setReviews(res.data.reviewsData);
        });
    } catch (error) {
      console.log(error);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i < 6; i++) {
      stars.push(
        <TouchableOpacity key={i} onPress={() => setRating(i)}>
          <FontAwesome
            name={i <= rating ? "star" : "star-o"}
            size={25}
            color={"#FF8D07"}
            style={{ marginHorizontal: 4, marginTop: -5 }}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  const handleReviewSubmit = async () => {
    try {
      await setAuthorizationHeader();
      await axios.post(`${process.env.EXPO_PUBLIC_SERVER_URI}/add-review`, {
        ratings: rating,
        review,
        courseId: params.id,
      });
      setreviewsLoader(false);
      setReview("");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.dark ? "#111" : "#fff" }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: moderateScale(10) }}>
          {/* Video Player */}
          <View
            style={{
              flex: 1,
              marginVertical: 10,
              backgroundColor: "#000",
              alignItems: "center",
            }}
          >
            <WebView
              source={{
                uri: `https://www.youtube.com/embed/${courseContents[activeVideo].videoUrl}`,
              }}
              style={{
                flex: 1,
                width: windowWidth(450),
                height: windowHeight(160),
              }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
            />
          </View>

          {/* Video Data */}
          <View
            style={{
              margin: scale(10),
              borderRadius: scale(5),
              backgroundColor: "#705DF2",
            }}
          >
            {/* arrows */}
            <View
              style={{
                position: "absolute",
                top: verticalScale(15),
                left: scale(5),
                zIndex: 1,
              }}
            >
              <TouchableOpacity onPress={() => handlePrevLesson()}>
                <AntDesign name="left" size={scale(20)} color={"#fff"} />
              </TouchableOpacity>
            </View>
            <View
              style={{
                position: "absolute",
                top: verticalScale(15),
                right: scale(5),
                zIndex: 1,
              }}
            >
              <TouchableOpacity
                onPress={() =>
                  handleNextLesson({
                    contentId: courseContents[activeVideo].id,
                  })
                }
              >
                <AntDesign name="right" size={scale(20)} color={"#fff"} />
              </TouchableOpacity>
            </View>

            {/* Video info */}
            <Text
              style={[
                styles.baseText,
                {
                  paddingTop: scale(15),
                },
              ]}
            >
              {activeVideo < 9 && "0"}
              {activeVideo + 1}.
            </Text>
            <View>
              <Text
                style={[
                  styles.baseText,
                  {
                    fontSize: fontSizes.FONT23,
                    paddingVertical: verticalScale(5),
                  },
                ]}
              >
                {courseContents[activeVideo].title}
              </Text>
              <Text
                style={[
                  styles.baseText,
                  {
                    fontSize: fontSizes.FONT23,
                    paddingVertical: verticalScale(5),
                  },
                ]}
              >
                Modules: {courseContents[activeVideo].videoSection}
              </Text>
            </View>
            <View
              style={{
                borderRadius: scale(5),
                borderTopLeftRadius: scale(10),
                borderTopRightRadius: scale(10),
                backgroundColor: "#5F50D2",
                marginTop: verticalScale(10),
                paddingVertical: scale(20),
                paddingHorizontal: scale(15),
              }}
            >
              <View
                style={{
                  width: WIDTH,
                  flexDirection: "row",
                }}
              >
                <View style={{ width: scale(145) }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <MaterialCommunityIcons
                      name="layers-triple-outline"
                      size={scale(20)}
                      color="white"
                    />
                    <Text
                      style={[
                        styles.baseText,
                        {
                          paddingLeft: scale(5),
                          fontSize: fontSizes.FONT25,
                        },
                      ]}
                    >
                      Resources
                    </Text>
                  </View>
                  {/* lists */}
                  {courseContents[activeVideo]?.links?.map(
                    (i: any, index: number) => (
                      <View
                        style={{ paddingVertical: verticalScale(5) }}
                        key={index}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            paddingBottom: verticalScale(5),
                          }}
                        >
                          <Text
                            style={[
                              styles.baseText,
                              {
                                marginRight: scale(5),
                                fontSize: fontSizes.FONT26,
                              },
                            ]}
                          >
                            {"\u2022"}
                          </Text>
                          <Text
                            style={[
                              styles.baseText,
                              {
                                textAlign: "left",
                                fontSize: fontSizes.FONT23,
                                textDecorationLine: "underline",
                                flex: 1,
                              },
                            ]}
                            onPress={() => Linking.openURL(i?.url)}
                          >
                            {i?.title}
                          </Text>
                        </View>
                      </View>
                    )
                  )}
                </View>
                <View style={{ width: scale(145) }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <MaterialCommunityIcons
                      name="file-certificate-outline"
                      size={scale(20)}
                      color="white"
                    />
                    <Text
                      style={[
                        styles.baseText,
                        {
                          paddingLeft: scale(5),
                          fontSize: fontSizes.FONT25,
                        },
                      ]}
                    >
                      Certificate
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={{
                      height: IsIPAD ? verticalScale(40) : verticalScale(35),
                      backgroundColor: "#000",
                      marginTop: verticalScale(10),
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                      borderRadius: scale(5),
                    }}
                  >
                    <Text
                      style={[styles.baseText, { fontSize: fontSizes.FONT23 }]}
                    >
                      Finish Quizzes
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      height: IsIPAD ? verticalScale(40) : verticalScale(35),
                      backgroundColor: "#4827BC",
                      marginTop: verticalScale(10),
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                      borderRadius: scale(5),
                    }}
                  >
                    <Text
                      style={[styles.baseText, { fontSize: fontSizes.FONT23 }]}
                    >
                      Support Group
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Tabs */}
          <View
            style={{
              flexDirection: "row",
              marginHorizontal: scale(10),
              gap: scale(10),
            }}
          >
            <TouchableOpacity
              style={{
                marginRight: scale(20),
                opacity: activeButton === "Overview" ? 1 : 0.7,
                paddingBottom: verticalScale(2),
                borderBottomWidth: activeButton === "Overview" ? 2 : 0,
                paddingHorizontal: scale(1),
                borderBottomColor: theme.dark ? "#fff" : "#191919",
              }}
              onPress={() => setActiveButton("Overview")}
            >
              <Text
                style={[
                  styles.baseText,
                  {
                    color: theme.dark ? "#fff" : "#000",
                    textAlign: "left",
                  },
                ]}
              >
                Overview
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                marginRight: scale(20),
                opacity: activeButton === "Q&A" ? 1 : 0.7,
                paddingBottom: verticalScale(2),
                borderBottomWidth: activeButton === "Q&A" ? 2 : 0,
                paddingHorizontal: scale(1),
                borderBottomColor: theme.dark ? "#fff" : "#191919",
              }}
              onPress={() => {
                setActiveButton("Q&A");
                questionsFetchHandler();
              }}
            >
              <Text
                style={[
                  styles.baseText,
                  {
                    textAlign: "left",
                    color: theme.dark ? "#fff" : "#000",
                  },
                ]}
              >
                Q&A
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                marginRight: scale(20),
                opacity: activeButton === "Reviews" ? 1 : 0.7,
                paddingBottom: verticalScale(2),
                borderBottomWidth: activeButton === "Reviews" ? 2 : 0,
                paddingHorizontal: scale(1),
                borderBottomColor: theme.dark ? "#fff" : "#191919",
              }}
              onPress={() => {
                setActiveButton("Reviews");
                reviewsFetchHandler();
              }}
            >
              <Text
                style={[
                  styles.baseText,
                  {
                    textAlign: "left",
                    color: theme.dark ? "#fff" : "#000",
                  },
                ]}
              >
                Reviews
              </Text>
            </TouchableOpacity>
          </View>

          {/* Overview */}
          {activeButton === "Overview" && (
            <View
              style={{
                marginHorizontal: scale(10),
                marginBottom: verticalScale(60),
                marginTop: verticalScale(7),
              }}
            >
              <Text
                style={[
                  styles.baseText,
                  {
                    color: theme.dark ? "#fff" : "#000",
                    opacity: 0.75,
                    fontSize: fontSizes.FONT19,
                    fontWeight: "normal",
                    textAlign: "left",
                    lineHeight: verticalScale(17.5),
                  },
                ]}
              >
                {courseContents[activeVideo]?.description}
              </Text>
            </View>
          )}

          {activeButton === "Q&A" && (
            <View style={{ flex: 1, margin: scale(12) }}>
              <View>
                <TextInput
                  value={question}
                  onChangeText={setQuestion}
                  placeholderTextColor={theme.dark ? "#fff" : "#000"}
                  placeholder="Ask a question..."
                  style={{
                    marginVertical: verticalScale(10),
                    flex: 1,
                    textAlignVertical: "top",
                    justifyContent: "flex-start",
                    backgroundColor: "transparent",
                    color: theme.dark ? "#fff" : "#000",
                    borderWidth: 1,
                    borderColor: theme.dark ? "#fff" : "#000",
                    borderRadius: scale(8),
                    height: verticalScale(75),
                    padding: scale(10),
                  }}
                  multiline={true}
                />
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "flex-end",
                  }}
                >
                  <TouchableOpacity
                    style={[styles.button]}
                    disabled={question === ""}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: fontSizes.FONT22,
                        fontWeight: "600",
                      }}
                    >
                      Submit
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={{ marginBottom: verticalScale(40) }}>
                  {questionsLoader && (
                    <>
                      {[0, 1, 2, 3, 4, 5].map((i: any) => (
                        <MotiView
                          key={i}
                          transition={{
                            type: "timing",
                          }}
                          style={{
                            flex: 1,
                            flexDirection: "row",
                            gap: scale(10),
                            marginVertical: verticalScale(10),
                          }}
                          animate={{
                            backgroundColor: theme.dark ? "#131313" : "#fff",
                          }}
                        >
                          <Skeleton
                            colorMode={theme.dark ? "dark" : "light"}
                            radius="round"
                            height={verticalScale(55)}
                            width={verticalScale(55)}
                          />
                          <View>
                            <Skeleton
                              colorMode={theme.dark ? "dark" : "light"}
                              width={scale(240)}
                              height={verticalScale(22)}
                            />
                            <Spacer height={verticalScale(15)} />
                            <Skeleton
                              colorMode={theme.dark ? "dark" : "light"}
                              width={scale(240)}
                              height={verticalScale(22)}
                            />
                          </View>
                        </MotiView>
                      ))}
                    </>
                  )}
                  {questions?.map((i: QuestionType, index: number) => (
                    <QuestionCard
                      question={i}
                      key={index}
                      activeVideo={activeVideo}
                      courseSlug={params?.slug}
                      setQuestions={setQuestions}
                    />
                  ))}
                </View>
              </View>
            </View>
          )}

          {activeButton === "Reviews" && (
            <View style={{ marginHorizontal: 16, marginVertical: 25 }}>
              <View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: verticalScale(5),
                  }}
                >
                  <Text
                    style={{
                      fontSize: fontSizes.FONT20,
                      fontFamily: "Poppins_500Medium",
                      color: theme.dark ? "#fff" : "#000",
                      paddingBottom: 10,
                      paddingLeft: 2,
                      paddingRight: 5,
                    }}
                  >
                    Give one rating:
                  </Text>
                  {renderStars()}
                </View>

                <TextInput
                  value={review}
                  onChangeText={setReview}
                  placeholder="Write your thoughts!"
                  style={{
                    flex: 1,
                    textAlignVertical: "top",
                    justifyContent: "flex-start",
                    backgroundColor: "transparent",
                    color: theme.dark ? "#fff" : "#000",
                    borderWidth: 1,
                    borderColor: theme.dark ? "#fff" : "#000",
                    borderRadius: scale(8),
                    height: verticalScale(75),
                    padding: scale(10),
                  }}
                  multiline={true}
                />
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "flex-end",
                  }}
                >
                  <TouchableOpacity
                    style={[
                      styles.button,
                      {
                        opacity: review === "" || reviewsLoader ? 0.5 : 1,
                      },
                    ]}
                    disabled={review === "" || reviewsLoader}
                    onPress={() => handleReviewSubmit()}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: fontSizes.FONT22,
                        fontWeight: "600",
                      }}
                    >
                      Submit
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={{ rowGap: 25 }}>
                <>
                  {reviews?.map((item: ReviewsType, index: number) => (
                    <ReviewCard item={item} key={index} />
                  ))}
                </>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom shortcuts */}
      <BottomCourseAccess
        bottomSheetRef={bottomSheetRef}
        courseContent={courseContents}
        courseData={params}
        activeVideo={activeVideo}
        setActiveVideo={setActiveVideo}
      />
    </View>
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
