import { Col, Row } from "react-bootstrap";
import { handleRateStars } from "../../utils/constants";
import "./rates.css";
import { Link, useParams } from "react-router-dom";
import LoaderContent from "../LoaderContent/LoaderContent";
import moment from "moment";
import "moment/locale/ar";
const Rates = ({ rates, type }) => {
  const { username } = useParams();
  return (
    <Col className="rates" lg={type === "page" ? 9 : 7} md={12} xs={12}>
      <h5 className="mb-3">آراء المشترين</h5>
      <hr />
      {rates ? (
        rates.map((rate, index) => (
          <Row key={rate.id} className="p-2">
            {type === "page" ? (
              <Row className="mb-3 mt-2">
                <h5>
                  <Link
                    to={`/user/${username}/services/${rate.home_service.id}`}
                  >
                    {rate.home_service.title}
                  </Link>
                </h5>
                <span className="text-muted d-flex gap-2 align-items-center w-max">
                  <ion-icon name="cube"></ion-icon>
                  {rate.home_service.category}
                </span>
              </Row>
            ) : null}
            <Row className="d-flex justify-content-between">
              <h6 className="w-max">جودة الخدمة</h6>
              <div className="stars">
                {handleRateStars(rate.quality_of_service)}
              </div>
            </Row>
            <Row className="d-flex justify-content-between">
              <h6 className="w-max">التسليم بالموعد</h6>
              <div className="stars">
                {handleRateStars(rate.commitment_to_deadline)}
              </div>
            </Row>
            <Row className="d-flex justify-content-between">
              <h6 className="w-max">أخلاقيات العمل</h6>
              <div className="stars">{handleRateStars(rate.work_ethics)}</div>
            </Row>
            <Row className="mt-3 mb-4 d-flex align-items-center gap-1">
              <Link
                to={`/user/${rate.client.username}`}
                className="w-max image-holder"
              >
                <img src={rate.client.photo} alt="profile" />
              </Link>
              <div className="info d-flex flex-column w-max gap-2">
                <Link to={`/user/${rate.client.username}`}>
                  {rate.client.first_name} {rate.client.last_name}
                </Link>
                <div className="d-flex gap-3">
                  <span className="d-flex align-items-center gap-2 text-muted">
                    <ion-icon name="person"></ion-icon>
                    المشتري
                  </span>
                  <span className="d-flex align-items-center gap-2 text-muted">
                    <ion-icon name="time"></ion-icon>
                    {moment(rate.rating_time).locale("ar").fromNow()}
                  </span>
                </div>
              </div>
            </Row>
            <Row>
              <p>{rate.client_comment}</p>
            </Row>
            {index < rates.length - 1 ? <hr /> : null}
          </Row>
        ))
      ) : (
        <LoaderContent />
      )}
      {rates?.length === 0 ? (
        <Row className="d-flex justify-content-center align-items-center">
          <h5 className="w-max"> لا يوجد تقييمات بعد</h5>
        </Row>
      ) : null}
    </Col>
  );
};

export default Rates;
