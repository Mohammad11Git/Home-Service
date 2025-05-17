import { useState } from "react";
import { postToAPI } from "../../api/FetchFromAPI";
import { Toaster, toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";
import "./forget-password.css";
import { ErrorMessage, Formik } from "formik";
import LoaderButton from "../../Components/LoaderButton";
import Cookies from "js-cookie";

const EmailSchema = Yup.object().shape({
  email: Yup.string()
    .email("أدخل بريد الكتروني صالح")
    .required("لم تدخل بريدك الالكتروني بعد"),
});
const ForgetPassword = () => {
  const [isSubmitting, setIsSubmitting] = useState(0);
  const history = useNavigate();
  const initialValues = { email: "" };
  const submitHandler = async (values) => {
    try {
      toast("الرجاء الانتظار", {
        duration: 3000,
        position: "top-center",
        ariaProps: {
          role: "status",
          "aria-live": "polite",
        },
      });
      setIsSubmitting(1);
      await postToAPI(
        "api/send_forget_password_code",
        { email: values.email },
        null
      );
      setIsSubmitting(0);
      Cookies.set("forgetPassEmail", values.email, { expires: 30 });
      toast.success("تم الطلب بنجاح وسيتم تحويلك الى التحقق من الرمز", {
        duration: 2000,
        position: "top-center",
        ariaProps: {
          role: "status",
          "aria-live": "polite",
        },
      });
      setTimeout(() => {
        history("/forget_password/confirm");
      }, 2000);
    } catch (err) {
      setIsSubmitting(0);
      console.log(err);
      if (err.response?.data?.email[0] === "This field is required") {
        toast.error("الرجاء ادخال بريدك الالكتروني", {
          duration: 3000,
          position: "top-center",
          ariaProps: {
            role: "status",
            "aria-live": "polite",
          },
        });
      } else if (
        err.response?.data?.email[0] === "Please input a valid email"
      ) {
        toast.error("الرجاء ادخال بريد الكتروني صالح", {
          duration: 3000,
          position: "top-center",
          ariaProps: {
            role: "status",
            "aria-live": "polite",
          },
        });
      } else if (err.response?.data?.detail === "Email does not exist") {
        toast.error("الرجاء ادخال بريدك الالكتروني", {
          duration: 3000,
          position: "top-center",
          ariaProps: {
            role: "status",
            "aria-live": "polite",
          },
        });
      } else if (
        err.response?.data?.detail.includes("Can't send , try again after")
      ) {
        toast.error("نفذ العدد المسموح للمحاولات الرجاء المحاولة لاحقا", {
          duration: 3000,
          position: "top-center",
          ariaProps: {
            role: "status",
            "aria-live": "polite",
          },
        });
      } else if (err.response.status === 500) {
        toast.error("حصل خطأ غير متوقع الرجاء اعادة المحاولة", {
          duration: 3000,
          position: "top-center",
          ariaProps: {
            role: "status",
            "aria-live": "polite",
          },
        });
      }
    }
  };
  return (
    <section className="d-flex justify-content-center align-items-center">
      <Toaster />
      <Formik initialValues={initialValues} validationSchema={EmailSchema}>
        {({ values, isValid, handleChange, handleBlur, errors, touched }) => (
          <form
            data-aos="fade-up"
            onSubmit={(e) => e.preventDefault()}
            className="forget"
          >
            <h2>نسيت كلمة المرور؟</h2>
            <h5>يرجى إدخال عنوان البريد الإلكتروني المرتبط بحسابك أدناه:</h5>
            <div className="email">
              <label>
                البريد الالكتروني
                <span>*</span>
              </label>
              <input
                className={`${touched.email && errors.email ? "error " : null}`}
                id="email"
                name="email"
                type="email"
                required
                placeholder="أدخل البريد الالكتروني الخاص بك"
                value={values.email}
                onBlur={handleBlur}
                onChange={handleChange}
              />
              <p>
                <ErrorMessage name="email" />
              </p>
            </div>
            <button
              className={!isValid ? "my-btn disable" : "my-btn"}
              disabled={!isValid}
              type="submit"
              hidden={isSubmitting}
              onClick={() => submitHandler(values)}
            >
              ارسال
            </button>
            <LoaderButton isSubmitting={isSubmitting} color="my-btn" />
          </form>
        )}
      </Formik>
    </section>
  );
};

export default ForgetPassword;
