import { FlatList, StyleSheet, Text, View } from "react-native";
import React from "react";
import { useTheme } from "@/context/theme.context";
import useGetCourses from "@/hooks/fetch/useGetCourses";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import SkeltonLoader from "@/utils/skelton";
import { scale, verticalScale } from "react-native-size-matters";
import CourseCard from "@/components/cards/course.card";

export default function EnrolledCourses() {
  const { theme } = useTheme();
  const { courses: coursesData, loading } = useGetCourses();
  const { courses } = useLocalSearchParams();
  const data = JSON.parse(courses as any);
  const enrolledCourses = coursesData?.filter((course: CourseType) =>
    data.some((enrolled: any) => enrolled.courseId === course.id)
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.dark ? "#131313" : "#fff",
      }}
    >
      <View style={{ flex: 1 }}>
        {loading ? (
          <>
            <SkeltonLoader />
            <SkeltonLoader />
          </>
        ) : (
          <View
            style={{
              paddingHorizontal: scale(8),
              paddingTop: verticalScale(10),
            }}
          >
            <FlatList
              data={enrolledCourses}
              showsVerticalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <CourseCard item={item} />}
              ListEmptyComponent={<Text>No courses Available yet!</Text>}
              ListFooterComponent={() => (
                <View
                  style={{
                    height: theme.dark ? verticalScale(60) : verticalScale(10),
                  }}
                ></View>
              )}
            />
          </View>
        )}
      </View>
    </View>
  );
}
