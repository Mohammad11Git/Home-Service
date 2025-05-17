import { Col, Container, Row } from "react-bootstrap";
import "./banner.css";
import { Link } from "react-router-dom";
const Banner = () => {
  return (
    <section className="signup-now">
      <Container>
        <Row>
          <Col>
            <h2>أنجز أعمالك بسهولة وأمان</h2>
            <Link
              to="/register"
              className="text-white text-decoration-none w-fit"
            >
              سجل الآن
            </Link>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default Banner;
