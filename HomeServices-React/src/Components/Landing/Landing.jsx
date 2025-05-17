import { Col, Container, Row } from "react-bootstrap";
import landing from "../../Images/home-1.jpg";
import "./landing.css";
import SearchBar from "../SeachBar/SearchBar";
const Landing = () => {
  return (
    <div
      className="image-container"
      style={{ backgroundImage: `url(${landing})` }}
    >
      <div className="overlay">
        <Container>
          <Row>
            <Col className="justify-content-center">
              <h1 data-aos="zoom-in" className="fs-1 w-fit mx-auto mb-4">
                موقع عربي لعرض الخدمات المنزلية
              </h1>
              <p
                data-aos="zoom-in-up"
                data-aos-delay="200"
                className="fs-5 w-fit mx-auto mb-6"
              >
                سهولة الوصول لمزودي الخدمات المناسبين
              </p>
              <SearchBar
                type="filled"
                goto="page"
                animName="zoom-in-up"
                animDelay="200"
              />
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
};

export default Landing;
