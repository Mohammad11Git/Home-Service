import { Col, Container, Row } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { handleRateStars } from "../../utils/constants";
import { fetchFromAPI } from "../../api/FetchFromAPI";
import { Fragment, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./service-details.css";
import {
  setSelectedServiceToUpdate,
  setSelectedUser,
  setUserToken,
  setUserTotalInfo,
} from "../../Store/homeServiceSlice";
import LoaderContent from "../../Components/LoaderContent/LoaderContent";
import Rates from "../../Components/Rates/Rates";
import Cookies from "js-cookie";
import { toast } from "react-hot-toast";

const ServiceDetails = () => {
  const { userTotalInfo, userToken, selectedUser } = useSelector(
    (state) => state.homeService
  );
  const dispatch = useDispatch();
  if (userToken === null) {
    const storedToken = Cookies.get("userToken");
    storedToken && dispatch(setUserToken(storedToken));
  }
  if (userTotalInfo === null) {
    const storedUser = Cookies.get("userTotalInfo");
    storedUser && dispatch(setUserTotalInfo(JSON.parse(storedUser)));
  }

  const [serviceDetails, setServiceDetails] = useState(null);
  const [serviceForm, setServiceForm] = useState(null);
  const [serviceRates, setServiceRates] = useState(null);
  const { username, id } = useParams();
  const history = useNavigate();
  const getServiceDetails = async () => {
    try {
      const data = await fetchFromAPI(`services/home_service/detail/${id}`);
      setServiceDetails(data);
      console.log("details:", data);
    } catch (err) {
      console.log(err);
    }
  };
  const getServiceForm = async () => {
    try {
      const data = await fetchFromAPI(
        `services/update_form_home_service/${id}`,
        {
          headers: {
            Authorization: `token ${userToken}`,
          },
        }
      );
      setServiceForm(data);
    } catch (err) {
      console.log(err);
    }
  };
  const getServiceRates = async () => {
    try {
      const data = await fetchFromAPI(`services/ratings/service/${id}`);
      setServiceRates(data);
    } catch (err) {
      console.log(err);
    }
  };
  const handelClickUpdate = () => {
    dispatch(
      setSelectedServiceToUpdate({ ...serviceDetails, form: serviceForm })
    );
    history(`/service/${id}/update`);
  };
  const handleBuyService = () => {
    if (userToken) {
      history(`/service/${id}/fill_form`);
    } else {
      toast.error("الرجاء تسجيل دخول أولا", {
        duration: 2000,
        position: "top-center",
        ariaProps: {
          role: "status",
          "aria-live": "polite",
        },
      });
      setTimeout(() => {
        history("/login");
      }, 2000);
    }
  };
  useEffect(() => {
    if (selectedUser === null) {
      const storedselectedUser = Cookies.get("selectedUser");
      storedselectedUser && dispatch(setSelectedUser(storedselectedUser));
    }
    if (userToken === null) {
      const storedToken = Cookies.get("userToken");
      storedToken && dispatch(setUserToken(storedToken));
    }
    userToken && getServiceForm();
    getServiceDetails();
    getServiceRates();
  }, []);
  return (
    <section className="service-details">
      <Container>
        {serviceDetails ? (
          <Fragment>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h4>{serviceDetails?.category.name}</h4>
                <h1 className="mb-4">{serviceDetails?.title}</h1>
              </div>
              {username === userTotalInfo?.username ? (
                <button onClick={() => handelClickUpdate()}>
                  تعديل الخدمة
                </button>
              ) : (
                <button onClick={() => handleBuyService()}>شراء الخدمة</button>
              )}
            </div>
            <Row>
              <Col lg={7} md={12}>
                <img
                  className="service-image mb-5"
                  src={serviceDetails?.category.photo}
                  alt=""
                />
                <p>{serviceDetails?.description}</p>
              </Col>
              <Col lg={4} md={12}>
                <h5>بطاقة الخدمة</h5>
                <hr />
                <ul>
                  <Row>
                    <Col>التقييمات</Col>
                    <Col className="stars">
                      {handleRateStars(serviceDetails?.average_ratings)}
                      <span>{`( ${serviceDetails?.number_of_served_clients} )`}</span>
                    </Col>
                  </Row>
                  <Row className="align-items-center">
                    <Col>عدد العملاء</Col>
                    <Col>{serviceDetails?.number_of_served_clients}</Col>
                  </Row>
                  <Row className="align-items-center">
                    <Col>متوسط سعر الخدمة بالساعة</Col>
                    <Col>{serviceDetails?.average_price_per_hour} ل.س</Col>
                  </Row>
                  <Row className="align-items-start">
                    <Col>الخدمة متاحة في</Col>
                    <Col className="areas d-flex gap-2 flex-wrap">
                      {serviceDetails?.service_area.map((area) => (
                        <span>{area.name}</span>
                      ))}
                    </Col>
                  </Row>
                </ul>
                <hr />
                <Row>
                  <h5 className="mb-3">صاحب الخدمة</h5>
                  <div className="user-card d-flex align-items-center gap-2">
                    <img
                      onClick={() => history(`/user/${username}`)}
                      src={serviceDetails?.seller.user.photo}
                      alt="profile"
                    />
                    <span onClick={() => history(`/user/${username}`)}>
                      {serviceDetails?.seller.user.first_name}{" "}
                      {serviceDetails?.seller.user.last_name}
                    </span>
                  </div>
                </Row>
              </Col>
              {/* customer comments and rate */}
              <Rates rates={serviceRates} type="comp" />
            </Row>
          </Fragment>
        ) : (
          <LoaderContent />
        )}
      </Container>
    </section>
  );
};

export default ServiceDetails;
