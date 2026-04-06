import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCurrentUser } from "../../redux/userSlice";

const useGetCurrentUser = () => {
  const dispatch = useDispatch();
  const status = useSelector((state) => state.user.status);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, status]);

  return null;
};

export default useGetCurrentUser;
