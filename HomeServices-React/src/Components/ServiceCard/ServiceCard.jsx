import { handleRateStars } from "../../utils/constants";
import "./service-card.css";
import { Tooltip } from "react-tooltip";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

const ServiceCard = ({ serviceData, id }) => {
  const history = useNavigate();
  return (
    <div className="service-card" data-aos="zoom-in">
      <Tooltip anchorSelect={`.image-${id}`} place="top">
        {serviceData?.seller.user.first_name}{" "}
        {serviceData?.seller.user.last_name}
      </Tooltip>
      <div className="d-flex flex-wrap align-items-center gap-2">
        <div className="image-holder">
          {serviceData?.seller.user.photo ? (
            <img
              onClick={() => {
                history(`/user/${serviceData?.seller.user.username}`);
                Cookies.set(
                  "selectedUser",
                  JSON.stringify(serviceData?.seller.user),
                  { expires: 2 }
                );
              }}
              className={`image-${id}`}
              src={serviceData.seller.user.photo}
              alt="profile"
            />
          ) : (
            <div className="image-skelton"></div>
          )}
        </div>
        <div className="stars d-flex gap-2">
          {handleRateStars(serviceData?.average_ratings)}
        </div>
      </div>
      <div className="d-flex flex-wrap align-items-center gap-2">
        <span
          onClick={() =>
            history(
              `/user/${serviceData?.seller.user.username}/services/${serviceData?.id}`
            )
          }
          className="title"
        >
          {serviceData?.title}
        </span>
        <span className="category">{serviceData?.category.name}</span>
      </div>
      <div>
        <span className="price">
          متوسط السعر بالساعة {serviceData?.average_price_per_hour}
        </span>
      </div>
    </div>
  );
};

export default ServiceCard;
