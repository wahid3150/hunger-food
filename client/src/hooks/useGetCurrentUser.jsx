import { useEffect, useState } from "react";
import axios from "axios";
import { serverUrl } from "../App";

const useGetCurrentUser = () => {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const res = await axios.get(`${serverUrl}/api/auth/current`, {
          withCredentials: true,
        });
        console.log(res);
        setCurrentUser(res.data);
      } catch (error) {
        console.log(error);
      }
    };

    getCurrentUser();
  }, []);

  return { currentUser };
};

export default useGetCurrentUser;
