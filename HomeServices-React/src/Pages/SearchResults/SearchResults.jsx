import { useEffect, useState } from "react";
import { fetchFromAPI } from "../../api/FetchFromAPI";
import { Col, Container, Row } from "react-bootstrap";
import ServiceCard from "../../Components/ServiceCard/ServiceCard";
import SearchBar from "../../Components/SeachBar/SearchBar";
import "./search-results.css";
import LoaderContent from "../../Components/LoaderContent/LoaderContent";
import { useDispatch, useSelector } from "react-redux";
import { setClearResults } from "../../Store/homeServiceSlice";
import Cookies from "js-cookie";
const SearchResults = () => {
  const { clearResults } = useSelector((state) => state.homeService);
  const searchWord = Cookies.get("searchWord");
  const [servicesList, setServiceList] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useDispatch();
  const getServicesBySearchWord = async () => {
    try {
      setIsLoading(true);
      const res = await fetchFromAPI(
        `services/list_home_services?title=${searchWord}`
      );
      setServiceList(res);
      setIsLoading(false);
      dispatch(setClearResults(false));
      console.log(res);
    } catch (err) {
      console.log(err);
      setIsLoading(false);
    }
  };
  useEffect(() => {
    getServicesBySearchWord();
  }, []);
  useEffect(() => {
    if (clearResults) {
      setServiceList(null);
      getServicesBySearchWord();
    }
  }, [clearResults]);
  return (
    <section className="search-results">
      <Container>
        <div className="d-flex justify-content-between align-items-center gap-4 flex-wrap mb-5">
          <div>
            <h1>نتائج البحث</h1>
          </div>
          <SearchBar type="filled" goto="inside" />
        </div>
        {isLoading ? <LoaderContent /> : null}
        <Row className="service-items justify-content-center d-flex gx-3 gy-4">
          {servicesList?.map((item) => (
            <Col lg={4} md={5} xs={9} key={item.id}>
              <ServiceCard serviceData={item} id={item.id} />
            </Col>
          ))}
        </Row>
        {servicesList?.length === 0 && !isLoading ? (
          <Row className="justify-content-center align-items-center">
            <h2 className="w-max">لا يوجد نتائج مطابقة جرب كلمة أخرى</h2>
          </Row>
        ) : null}
      </Container>
    </section>
  );
};

export default SearchResults;
