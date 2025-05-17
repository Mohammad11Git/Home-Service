import { Container } from "react-bootstrap";
import { fetchFromAPI, postToAPI } from "../../api/FetchFromAPI";
import { useEffect, useRef, useState } from "react";
import "./fill-service-form.css";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Toaster, toast } from "react-hot-toast";
import { Fragment } from "react";
import LoaderContent from "../../Components/LoaderContent/LoaderContent";
import LoaderButton from "../../Components/LoaderButton";
import { setUserToken } from "../../Store/homeServiceSlice";
import Cookies from "js-cookie";
const FillServiceForm = () => {
  const { userToken } = useSelector((state) => state.homeService);
  const dispatch = useDispatch();
  if (userToken === null) {
    const storedToken = Cookies.get("userToken");
    storedToken && dispatch(setUserToken(storedToken));
  }
  const { id } = useParams();
  const history = useNavigate();
  const [formQuestions, setFormQuestions] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(0);
  const getFormQuestions = async () => {
    try {
      const res = await fetchFromAPI(`services/order_service/${id}`, {
        headers: {
          Authorization: `token ${userToken}`,
        },
      });
      setFormQuestions(res);
      console.log(res);
    } catch (err) {
      console.log(err);
    }
  };
  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];
  useEffect(() => {
    getFormQuestions();
  }, []);
  const handleSubmit = async () => {
    const formData = [];
    for (let i = 0; i < formQuestions?.length; ++i) {
      formData.push({
        field: formQuestions[i].id,
        content: inputRefs[i].current.value,
      });
    }
    console.log(formData);
    toast("يتم الآن تقديم فورم الخدمة", {
      duration: 3000,
      position: "top-center",
      ariaProps: {
        role: "status",
        "aria-live": "polite",
      },
    });
    setIsSubmitting(1);
    const answerData = {
      expected_time_by_day_to_finish: inputRefs[3].current.value,
      form_data: formData,
    };
    try {
      await postToAPI(`services/order_service/${id}`, answerData, {
        headers: {
          Authorization: `token ${userToken}`,
        },
      });
      setIsSubmitting(0);
      toast.success("تم تقديم فورم الخدمة بنجاح", {
        duration: 3000,
        position: "top-center",
        ariaProps: {
          role: "status",
          "aria-live": "polite",
        },
      });
      setTimeout(() => {
        history("/my_order");
      }, 1000);
    } catch (err) {
      setIsSubmitting(0);
      console.log(err);
      if (err.response.data?.expected_time_by_day_to_finish) {
        toast.error("الرجاء ادخال قيمة مدة الانتهاء بين 1 و 90 يوم", {
          duration: 3000,
          position: "top-center",
          ariaProps: {
            role: "status",
            "aria-live": "polite",
          },
        });
      } else if (err.response.data?.length > 0) {
        toast.error("الرجاء ملئ جميع الحقول", {
          duration: 3000,
          position: "top-center",
          ariaProps: {
            role: "status",
            "aria-live": "polite",
          },
        });
      } else if (
        err.response.data.detail === "you have already ordered this service"
      ) {
        toast.error("لقد طلبت هذه الخدمة سابقا راجع قسم الطلبات المرسلة", {
          duration: 3000,
          position: "top-center",
          ariaProps: {
            role: "status",
            "aria-live": "polite",
          },
        });
      } else if (
        err.response.data?.detail ===
        "You have unrated services please rate it and order again"
      ) {
        toast.error("لا يمكنك الشراء لديك خدمة بحاجة الى تقييم أولا", {
          duration: 3000,
          position: "top-center",
          ariaProps: {
            role: "status",
            "aria-live": "polite",
          },
        });
        setTimeout(() => {
          history("/my_order");
        }, 3000);
      }
    }
    console.log(answerData);
  };
  return (
    <section className="fill-service-form">
      <Toaster />
      <Container>
        {formQuestions ? (
          <Fragment>
            <h1>الرجاء ملئ فورم الخدمة</h1>
            <form onSubmit={(e) => e.preventDefault()} action="">
              {formQuestions?.map((item, index) => (
                <div key={index} className="question">
                  <label htmlFor="">{item.title}</label>
                  <input
                    required
                    ref={inputRefs[index]}
                    type={item.field_type}
                  />
                  {item.note.length > 0 ? <p>{item.note}</p> : null}
                </div>
              ))}
              <button hidden={isSubmitting} onClick={() => handleSubmit()}>
                تقديم الفورم
              </button>
              <LoaderButton isSubmitting={isSubmitting} color="my-btn" />
            </form>
          </Fragment>
        ) : (
          <LoaderContent />
        )}
      </Container>
    </section>
  );
};

export default FillServiceForm;
