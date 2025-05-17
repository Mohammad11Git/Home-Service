import { Fragment } from "react";
import Landing from "../Components/Landing/Landing";
import HowWorks from "../Components/HowWorks/HowWorks";
import CommonQuetions from "../Components/CommonQuetions/CommonQutions";
import Banner from "../Components/Banner/Banner";

const Home = () => {
  return (
    <Fragment>
      <Landing />
      <HowWorks />
      <CommonQuetions />
      <Banner />
    </Fragment>
  );
};

export default Home;
