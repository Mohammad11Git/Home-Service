import { Container, Navbar, Offcanvas, Spinner } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../../Images/logo.png";
import LogoBlack from "../../Images/logo-black.png";

import "./provider-navbar.css";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { toast } from "react-hot-toast";
import { postToAPI } from "../../api/FetchFromAPI";
const ProviderNavbar = () => {
  const [providerUser, setProviderUser] = useState(null);
  const [providerToken, setProviderToken] = useState(null);
  const [show, setShow] = useState(false);
  const [isSubmit, setIsSubmit] = useState(false);

  useEffect(() => {
    const storedproviderUser = Cookies.get("providerUser");
    const storedproviderToken = Cookies.get("providerToken");
    storedproviderUser && setProviderUser(JSON.parse(storedproviderUser));
    storedproviderToken && setProviderToken(storedproviderToken);
  }, []);
  const history = useNavigate();
  const handleLogout = async () => {
    toast("يتم الآن تسجيل الخروج", {
      duration: 3000,
      position: "top-center",
      ariaProps: {
        role: "status",
        "aria-live": "polite",
      },
    });
    let bearer = `token ${providerToken}`;
    try {
      setIsSubmit(true);
      await postToAPI("api/logout/", null, {
        headers: {
          Authorization: bearer,
        },
      });
      setIsSubmit(false);
      Cookies.remove("ProviderUser");
      Cookies.remove("ProviderToken");
      setTimeout(() => {
        setShow(false);
        history("/");
      }, 1000);
    } catch (err) {
      setIsSubmit(false);
      console.log(err);
    }
  };
  return (
    <Navbar
      fixed="top"
      expand="md"
      className="provider-navbar fixed left-0 top-0 w-screen"
    >
      <Container className="d-flex justify-content-between align-items-center">
        <Navbar.Brand
          className="d-flex gap-2 align-items-center"
          to="/provider"
        >
          <ion-icon
            onClick={() => setShow(true)}
            className="menu-icon"
            name="menu"
          ></ion-icon>

          <Link
            to="/provider"
            className="logo text-black d-flex gap-2 align-items-start"
          >
            <ion-icon name="star"></ion-icon>
            <img src={Logo} alt="Logo" />
          </Link>
        </Navbar.Brand>
      </Container>
      <Offcanvas className="provider-offcanvas" placement="end" show={show}>
        <div className="head d-flex align-items-center gap-3 px-3 pt-4 pb-3">
          <ion-icon
            onClick={() => setShow(false)}
            className="menu-icon"
            name="close"
          ></ion-icon>
          <Link
            className="logo text-black"
            onClick={() => setShow(false)}
            to="/"
          >
            <img src={LogoBlack} alt="Logo" />
          </Link>
        </div>
        <hr />
        <Offcanvas.Body>
          <ul className="mt-2 px-4 d-flex flex-column gap-3">
            <Link
              className="text-decoration-none text-black d-flex gap-2 align-items-center"
              onClick={() => setShow(false)}
              to="/provider"
            >
              <ion-icon name="cash-outline"></ion-icon>
              <span>تحويل رصيد</span>
            </Link>
            {providerUser?.is_admin ? (
              <Link
                className="text-decoration-none text-black d-flex gap-2 align-items-center"
                onClick={() => setShow(false)}
                to="/website_earnings"
              >
                <ion-icon name="trophy-outline"></ion-icon>
                <span> عرض الأرباح</span>
              </Link>
            ) : null}
            <div className="d-flex gap-4 align-items-center">
              <Link
                className={`${
                  isSubmit ? "loading" : ""
                } text-decoration-none text-black d-flex gap-2 align-items-center`}
                onClick={() => (!isSubmit ? handleLogout() : null)}
                to="/provider"
              >
                <ion-icon name="log-out-outline"></ion-icon>
                <span>تسجيل خروج</span>
              </Link>
              <Spinner
                hidden={!isSubmit}
                size="sm"
                as="span"
                animation="border"
                role="status"
                aria-hidden="true"
              />
            </div>
          </ul>
        </Offcanvas.Body>
      </Offcanvas>
    </Navbar>
  );
};

export default ProviderNavbar;
