import { Container, Row } from "react-bootstrap";
import Rates from "../../Components/Rates/Rates";
import "./seller-rates.css";
import UserProfileLayout from "../../Components/UserProfileLayout";
import { useEffect, useState } from "react";
import { setIsSelected } from "../../Store/homeServiceSlice";
import { useDispatch } from "react-redux";
import { fetchFromAPI } from "../../api/FetchFromAPI";
import { useParams } from "react-router-dom";
const SellerRates = () => {
  const dispatch = useDispatch();
  const [userRates, setUserRates] = useState(null);
  const { username } = useParams();
  useEffect(() => {
    dispatch(setIsSelected(3));
    getUserRates();
  }, []);
  const getUserRates = async () => {
    try {
      const data = await fetchFromAPI(`services/ratings/username/${username}`);
      setUserRates(data);
      console.log(data);
    } catch (err) {
      console.log(err);
    }
  };
  return (
    <UserProfileLayout>
      <section className="seller-rates">
        <Container>
          <Row>
            <Rates rates={userRates} type="page" />
          </Row>
        </Container>
      </section>
    </UserProfileLayout>
  );
};

export default SellerRates;
