import axios from "axios";
import { useEffect, useState } from "react";

const useGetCourses = () => {
  const [courses, setCourses] = useState<CourseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get(
          `${process.env.EXPO_PUBLIC_SERVER_URI}/get-courses`
        );

        setCourses(response.data.courses);
        setLoading(false);
      } catch (error: any) {
        setError(error.message);
      }
    };

    fetchCourses();
  }, []);

  return { courses, loading, error };
};

export default useGetCourses;