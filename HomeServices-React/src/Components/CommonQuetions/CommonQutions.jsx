import { Accordion, Container } from "react-bootstrap";
import { commonQuetionsData } from "../../utils/constants";
import "./common-quetions.css";
import { Fragment } from "react";
const CommonQuetions = () => {
  return (
    <section className="quetions">
      <Container>
        <h1 className="mx-auto mb-5 w-max">الأسئلة الشائعة</h1>
        <Accordion>
          {commonQuetionsData.map((quetion, index) => (
            <Fragment key={index}>
              <Accordion.Item eventKey={quetion.id}>
                <Accordion.Header>{quetion.head}</Accordion.Header>
                <Accordion.Body>{quetion.text}</Accordion.Body>
              </Accordion.Item>
              <hr />
            </Fragment>
          ))}
        </Accordion>
      </Container>
    </section>
  );
};

export default CommonQuetions;
