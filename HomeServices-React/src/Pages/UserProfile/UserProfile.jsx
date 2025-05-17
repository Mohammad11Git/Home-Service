import { Col, Container, Row } from "react-bootstrap";
import { useSelector } from "react-redux";
import "./user-profile.css";
import UserProfileLayout from "../../Components/UserProfileLayout";
import ServicesList from "../../Components/ServicesList/ServicesList";
import { getTimeofSeconds, handleRateStars } from "../../utils/constants";
const UserProfile = () => {
  const { selectedUser,userTotalInfo } = useSelector((state) => state.homeService);
  return (
    <UserProfileLayout>
      {selectedUser?.mode === "seller" ? (
        <div className="user-profile">
          <Container>
            <Row>
              <Col lg={7} md={12}>
                <h2> {selectedUser?.username === userTotalInfo?.username ?"نبذة عني":"النبذة"} </h2>
                <hr />
                <p>
                  {selectedUser?.bio?.length > 0
                    ? selectedUser.bio
                    : "لم يكتب نبذة شخصية"}
                </p>
              </Col>
              <Col lg={4} md={12}>
                <h2>إحصائيات</h2>
                <hr />
                <ul>
                  <Row>
                    <Col>التقييمات</Col>
                    <Col className="stars">
                      {handleRateStars(
                        selectedUser?.average_rating,
                        selectedUser?.clients_number
                      )}
                    </Col>
                  </Row>
                  <Row>
                    <Col>الخدمات المنشورة</Col>
                    <Col>{selectedUser?.services_number}</Col>
                  </Row>
                  <Row>
                    <Col>عدد العملاء</Col>
                    <Col>{selectedUser?.clients_number}</Col>
                  </Row>
                  <Row>
                    <Col>متوسط سرعة الرد</Col>
                    <Col>
                      {selectedUser?.average_fast_answer
                        ? getTimeofSeconds(selectedUser?.average_fast_answer)
                        : "لم يحسب بعد"}
                    </Col>
                  </Row>
                </ul>
              </Col>
              <Col lg={7} md={12}>
                <h2>{selectedUser?.username === userTotalInfo?.username ?"خدماتي":"الخدمات"}</h2>
                <hr />
                <ServicesList type="comp" />
              </Col>
            </Row>
          </Container>
        </div>
      ) : null}
    </UserProfileLayout>
  );
};

export default UserProfile;
