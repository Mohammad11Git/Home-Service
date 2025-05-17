import { Fragment, useEffect, useState } from "react";
import "./earning.css";
import { Container, Table } from "react-bootstrap";
import { fetchFromAPI } from "../../api/FetchFromAPI";
import Cookies from "js-cookie";
import LoaderContent from "../../Components/LoaderContent/LoaderContent";
import moment from "moment";

const Earnings = () => {
  const [allEarnings, setAllEarnings] = useState(null);
  const storedproviderToken = Cookies.get("providerToken");
  const getAllEarnings = async () => {
    let bearer = `token ${storedproviderToken}`;
    try {
      const res = await fetchFromAPI("services/earnings", {
        headers: {
          Authorization: bearer,
        },
      });
      setAllEarnings(res);
      console.log(res);
    } catch (err) {
      console.log(err);
    }
  };
  useEffect(() => {
    getAllEarnings();
  }, []);
  return (
    <div className="earnings">
      {allEarnings ? (
        <Fragment>
          <Container>
            <div className="d-flex gap-2 align-items-center mx-auto w-max mb-5">
              <h1>الأرباح</h1>
              <ion-icon name="trophy"></ion-icon>
            </div>
          </Container>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>معرف الخدمة</th>
                <th>اسم الخدمة</th>
                <th>اسم البائع</th>
                <th>قيمة الربح</th>
                <th>الجهة المستفيدة</th>
                <th>تاريخ الربح</th>
              </tr>
            </thead>
            <tbody>
              {allEarnings.map((item) => (
                <tr>
                  <td>
                    {item.home_service.service_id
                      ? item.home_service.service_id
                      : "NA"}
                  </td>
                  <td>
                    {item.home_service.title ? item.home_service.title : "NA"}
                  </td>
                  <td>
                    {item.home_service.seller_full_name
                      ? item.home_service.seller_full_name
                      : "NA"}
                  </td>
                  <td>{item.earnings}</td>
                  <td>{item.beneficiary.beneficiary_name}</td>
                  <td>
                    {moment(item.created_date)
                      .local("en")
                      .format("dddd , MMMM Do  YYYY , h:mm:ss a")}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Fragment>
      ) : (
        <LoaderContent />
      )}
    </div>
  );
};

export default Earnings;
