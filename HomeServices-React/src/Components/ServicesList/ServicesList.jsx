import { Col, Container, Row } from "react-bootstrap";
import "./services-list.css";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { fetchFromAPI } from "../../api/FetchFromAPI";
import { useNavigate, useParams } from "react-router-dom";
import LoaderContent from "../LoaderContent/LoaderContent";

const ServicesList = ({ type }) => {
  const { selectedUser } = useSelector((state) => state.homeService);
  const [serviceList, setServiceList] = useState(null);
  const history = useNavigate();
  const { username } = useParams();
  const getServiceList = async () => {
    try {
      const serviceData = await fetchFromAPI(
        `services/list_home_services?username=${username}`
      );
      setServiceList(serviceData);
    } catch (err) {
      console.log(err);
    }
  };
  useEffect(() => {
    getServiceList();
  }, [selectedUser]);
  if (selectedUser?.services_number > 0) {
    if (type === "page") {
      return (
        <section className="services page ">
          <Container>
            <Row className="justify-content-center">
              {serviceList ? (
                serviceList.map((item, index) => (
                  <Col
                    key={item.id}
                    lg={type === "page" ? 3 : 5}
                    md={5}
                    xs={10}
                    data-aos="zoom-in"
                    data-aos-delay={`${index}00`}
                  >
                    <div className="image-holder">
                      <img
                        onClick={() =>
                          history(`/user/${username}/services/${item.id}`)
                        }
                        src={item.category.photo}
                        alt=""
                      />
                    </div>
                    <h1
                      onClick={() =>
                        history(`/user/${username}/services/${item.id}`)
                      }
                    >
                      {item.title}
                    </h1>
                    <span>{item.category.name}</span>
                    <span> {item.average_price_per_hour} ل.س</span>
                  </Col>
                ))
              ) : (
                <LoaderContent />
              )}
            </Row>
          </Container>
        </section>
      );
    } else {
      return (
        <Row className="services justify-content-center">
          {serviceList ? (
            serviceList.map((item, index) => (
              <Col
                className="serv"
                key={item.id}
                lg={type === "page" ? 3 : 5}
                md={5}
                xs={10}
                data-aos="zoom-in"
                data-aos-delay={`${index}00`}
              >
                <div className="image-holder">
                  <img
                    onClick={() =>
                      history(`/user/${username}/services/${item.id}`)
                    }
                    src={item.category.photo}
                    alt=""
                  />
                </div>
                <h1
                  onClick={() =>
                    history(`/user/${username}/services/${item.id}`)
                  }
                >
                  {item.title}
                </h1>
                <span>{item.category.name}</span>
                <span> {item.average_price_per_hour} ل.س</span>
              </Col>
            ))
          ) : (
            <LoaderContent />
          )}
        </Row>
      );
    }
  } else {
    if (type === "page") {
      return (
        <Row className="services page fs-4 px-5 py-4">
          لم يقم بإضافة خدمات بعد
        </Row>
      );
    } else return "لم يقم بإضافة خدمات بعد";
  }
};
export default ServicesList;
