import React from "react";
import "./style.css";
import { Container, Row } from "react-bootstrap";
import Logo from "../../Images/logo.png";
const Footer = () => {
  return (
    <footer>
      <Container>
        <Row className="footer-row d-flex justify-content-between align-items-center">
          <div className="logo">
            <img src={Logo} alt="" />
          </div>
          <p className="w-max">© 2025 منزلي. جميع الحقوق محفوظة.</p>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
