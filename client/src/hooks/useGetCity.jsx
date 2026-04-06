import { useEffect } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setCity } from "../../redux/userSlice";

function useGetCity() {
  const dispatch = useDispatch();
  const userData = useSelector((state) => state.user.userData);
  const city = useSelector((state) => state.user.city);
  const apiKey = import.meta.env.VITE_GEOAPIKEY;

  useEffect(() => {
    if (!apiKey) return;

    navigator.geolocation.getCurrentPosition(async (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      console.log("Current location:", { latitude, longitude });

      const result = await axios.get(
        `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&format=json&apiKey=${apiKey}`,
      );

      const firstResult = result?.data?.results?.[0] || {};
      const resolvedCity =
        firstResult.city ||
        firstResult.town ||
        firstResult.village ||
        firstResult.county ||
        firstResult.state ||
        "";

      console.log("Resolved location:", resolvedCity, firstResult);
      dispatch(setCity(resolvedCity));
    });
  }, [userData, apiKey, dispatch]);

  return { city };
}

export default useGetCity;

