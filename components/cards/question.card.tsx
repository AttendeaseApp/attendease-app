import {
  View,
  Text,
  Pressable,
  Image,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import React, { useRef, useState } from "react";
import { useTheme } from "@/context/theme.context";
import { scale, verticalScale } from "react-native-size-matters";
import { fontSizes } from "@/themes/app.constant";
import moment from "moment";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { setAuthorizationHeader } from "@/hooks/fetch/useUser";
import axios from "axios";

export default function QuestionCard({
  question,
  setQuestions,
  activeVideo,
  courseSlug,
}: {
  question: QuestionType;
  setQuestions: React.Dispatch<React.SetStateAction<QuestionType[]>>;
  activeVideo: number;
  courseSlug: string;
}) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [reply, setReply] = useState("");
  const [replyLoader, setReplyLoader] = useState(false);

  const replyInputRef = useRef<TextInput>(null);

  const openKeyboard = () => {
    setOpen(!open);
    if (replyInputRef.current) {
      replyInputRef.current.focus();
    }
  };

  const handleReplySubmit = async () => {
    setReplyLoader(true);
    await setAuthorizationHeader();
    await axios
      .put(`${process.env.EXPO_PUBLIC_SERVER_URI}/adding-reply`, {
        questionId: question.id,
        answer: reply,
        contentId: question.contentId,
        activeVideo: activeVideo,
        courseSlug: courseSlug,
      })
      .then((res) => {
        setReplyLoader(false);
        setReply("");
        setQuestions(res.data.question);
      })
      .catch((error) => {
        console.log(error);
        setReplyLoader(false);
      });
  };

  return (
    <View>
      <Pressable
        style={{ flexDirection: "row", paddingVertical: verticalScale(8) }}
      >
        <Image
          style={{
            width: scale(40),
            height: scale(40),
            borderRadius: scale(100),
          }}
          source={{
            uri:
              question.user?.avatar ||
              "https://res.cloudinary.com/dshp9jnuy/image/upload/v1665822253/avatars/nrxsg8sd9iy10bbsoenn.png",
          }}
        />
        <View style={{ marginHorizontal: scale(6), flex: 1 }}>
          <View style={{ flex: 1, justifyContent: "space-around" }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View>
                <Text
                  style={{
                    fontSize: fontSizes.FONT18,
                    fontWeight: "600",
                    color: theme.dark ? "#fff" : "#000",
                  }}
                >
                  {question?.user?.name}
                </Text>
                <Text
                  style={{
                    fontSize: fontSizes.FONT15,
                    paddingVertical: verticalScale(2),
                    paddingHorizontal: scale(2),
                    opacity: 0.8,
                    color: theme.dark ? "#fff" : "#000",
                  }}
                >
                  {question.question}
                </Text>
                <Text
                  style={{
                    fontSize: fontSizes.FONT15,
                    paddingVertical: verticalScale(3),
                    paddingHorizontal: scale(3),
                    opacity: 0.8,
                    color: theme.dark ? "#fff" : "#000",
                  }}
                >
                  {moment(question.createdAt).fromNow()}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Pressable>

      {question?.answers?.length === 0 ? (
        <TouchableOpacity onPress={() => openKeyboard()}>
          <Text
            style={{
              fontSize: fontSizes.FONT16,
              paddingLeft: scale(45),
              paddingBottom: verticalScale(8),
              color: theme.dark ? "#fff" : "#000",
            }}
          >
            Add Reply
          </Text>
        </TouchableOpacity>
      ) : (
        <View>
          <TouchableOpacity onPress={() => setShowReplies(!showReplies)}>
            <Text
              style={{
                fontSize: fontSizes.FONT16,
                paddingLeft: scale(45),
                paddingBottom: verticalScale(8),
                color: theme.dark ? "#fff" : "#000",
              }}
            >
              {!showReplies ? "Show" : "Hide"} Replies
            </Text>
          </TouchableOpacity>
          {showReplies && (
            <>
              {question?.answers?.map((reply: AnswerType, index: number) => (
                <View
                  style={{
                    flexDirection: "row",
                    paddingVertical: verticalScale(8),
                    paddingHorizontal: scale(15),
                  }}
                  key={index}
                >
                  <Image
                    style={{
                      width: scale(40),
                      height: scale(40),
                      borderRadius: scale(100),
                    }}
                    source={{
                      uri:
                        reply.user?.avatar ||
                        "https://res.cloudinary.com/dshp9jnuy/image/upload/v1665822253/avatars/nrxsg8sd9iy10bbsoenn.png",
                    }}
                  />
                  <View style={{ marginHorizontal: scale(6), flex: 1 }}>
                    <View style={{ flex: 1, justifyContent: "space-around" }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <View>
                          <Text
                            style={{
                              fontSize: fontSizes.FONT18,
                              fontWeight: "600",
                              color: theme.dark ? "#fff" : "#000",
                            }}
                          >
                            {reply.user.name}{" "}
                            {reply.user.role === "Admin" && (
                              <MaterialIcons
                                name="verified"
                                size={scale(14)}
                                color="#0095F6"
                              />
                            )}
                          </Text>
                          <Text
                            style={{
                              fontSize: fontSizes.FONT15,
                              paddingVertical: verticalScale(2),
                              paddingHorizontal: scale(2),
                              opacity: 0.8,
                              color: theme.dark ? "#fff" : "#000",
                            }}
                          >
                            {reply?.answer}
                          </Text>
                          <Text
                            style={{
                              fontSize: fontSizes.FONT15,
                              paddingVertical: verticalScale(3),
                              paddingHorizontal: scale(3),
                              opacity: 0.8,
                              color: theme.dark ? "#fff" : "#000",
                            }}
                          >
                            {moment(reply.createdAt).fromNow()}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
              <TouchableOpacity onPress={() => openKeyboard()}>
                <Text
                  style={{
                    fontSize: fontSizes.FONT16,
                    paddingLeft: scale(62),
                    paddingBottom: verticalScale(8),
                    color: theme.dark ? "#fff" : "#000",
                  }}
                >
                  Add Reply
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
      {open && (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{
            marginBottom: verticalScale(10),
            width: scale(265),
            marginLeft: "auto",
            position: "relative",
            flexDirection: "row",
          }}
        >
          <TextInput
            value={reply}
            ref={replyInputRef}
            onChangeText={setReply}
            placeholderTextColor={theme.dark ? "#fff" : "#000"}
            placeholder="Add your reply..."
            style={{
              color: theme.dark ? "#fff" : "#000",
              borderWidth: 1,
              width: "92%",
              borderColor: theme.dark ? "#fff" : "#000",
              padding: scale(8),
              borderRadius: scale(5),
              minHeight: verticalScale(30),
              marginRight: scale(20),
            }}
            multiline={true}
          />
          <TouchableOpacity
            style={{
              position: "absolute",
              bottom: 0,
              zIndex: 9999,
              right: scale(-5),
              opacity: reply === "" || replyLoader ? 0.5 : 1,
            }}
            onPress={() => handleReplySubmit()}
            disabled={reply === "" || replyLoader}
          >
            <Ionicons name="send" size={scale(20)} color={"#2467EC"} />
          </TouchableOpacity>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}
