import { useState } from "react";
import { Container } from "react-bootstrap";
import { Toaster, toast } from "react-hot-toast";
import "./verification-email.css";
import { postToAPI } from "../../api/FetchFromAPI";
import VerificationCodeInput from "../../Components/VerificationCodeInput/VerificationCodeInput";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

const VerificationEmail = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgetPassEmail, setForgetPassEmail] = useState(false);
  const history = useNavigate();
  useEffect(() => {
    const email = Cookies.get("forgetPassEmail");
    if (!email || email === "") history(-1);
    setForgetPassEmail(email);
  }, []);
  const resendCode = () => {
    setIsSubmitting(true);
    toast("يتم اعادة ارسال رمز التخقق بنجاح", {
      duration: 3000,
      position: "top-center",
      ariaProps: {
        role: "status",
        "aria-live": "polite",
      },
    });
    postToAPI("api/resend_email_code", { email: forgetPassEmail })
      .then((res) => {
        console.log(res);
        setIsSubmitting(false);
        toast.success("تم اعادة ارسال رمز التخقق بنجاح", {
          duration: 3000,
          position: "top-center",
          ariaProps: {
            role: "status",
            "aria-live": "polite",
          },
        });
      })
      .catch((err) => {
        console.log(err);
        setIsSubmitting(false);
      });
  };
  return (
    <section className="verification-email mt-6 d-flex justify-content-center align-items-center">
      <Toaster />
      <Container className="d-flex flex-column gap-2">
        <h1 className="w-max mx-auto">اعادة تعيين كلمة المرور</h1>
        <p className="fs-5 w-fit text-center mx-auto">
          {" "}
          يرجى التحقق من صندوق البريد الوارد والعثور على بريدك الإلكتروني الذي
          يحتوي على رمز التحقق
        </p>
        <VerificationCodeInput />
        <div className="resend-code d-flex gap-1">
          <p>لم يصلك رمز التحقق بعد؟</p>
          <span onClick={() => (!isSubmitting ? resendCode() : null)}>
            اعادة الارسال
          </span>
        </div>
      </Container>
    </section>
  );
};

export default VerificationEmail;
