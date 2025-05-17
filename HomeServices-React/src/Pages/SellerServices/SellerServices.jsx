import { useEffect } from "react";
import UserProfileLayout from "../../Components/UserProfileLayout";
import { useDispatch } from "react-redux";
import { setIsSelected } from "../../Store/homeServiceSlice";
import ServicesList from "../../Components/ServicesList/ServicesList";

const SellerServices = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(setIsSelected(2));
  }, []);
  return (
    <UserProfileLayout>
      <ServicesList type="page" />
    </UserProfileLayout>
  );
};

export default SellerServices;
