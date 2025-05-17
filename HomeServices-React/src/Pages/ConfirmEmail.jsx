import { useState } from "react";
import VerificationCodeInput from "../Components/VerificationCodeInput/VerificationCodeInput";
import { Container, Spinner } from "react-bootstrap";
import { postToAPI } from "../api/FetchFromAPI";
import { Toaster, toast } from "react-hot-toast";
import Cookies from "js-cookie";

const ConfirmEmail = () => {
  const storedUser = Cookies.get("userInputValue");
  const userInputValue = storedUser ? JSON.parse(storedUser) : null;
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    postToAPI("api/resend_email_code", { email: userInputValue.email })
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
    <section className="confirm-email mt-6 d-flex justify-content-center align-items-center">
      <Toaster />
      <Container className="w-100 d-flex flex-column gap-2">
        <h1>يرجى تأكيد عنوان بريدك الالكتروني</h1>
        <h3>شكراً لتسجيلك في موقعنا</h3>
        <p className="fs-5">
          {" "}
          يرجى التحقق من صندوق البريد الوارد والعثور على بريدك الإلكتروني الذي
          يحتوي على رمز التحقق
        </p>
        <VerificationCodeInput />
        <div className="resend-code d-flex gap-1">
          <span>لم يصلك رمز التحقق بعد؟</span>
          <div className="d-flex gap-4 align-items-center">
            <a
              className={`${isSubmitting ? "loading-text" : ""}`}
              onClick={() => (!isSubmitting ? resendCode() : null)}
            >
              اعادة الارسال
            </a>
            <Spinner
              hidden={!isSubmitting}
              size="sm"
              as="span"
              animation="border"
              role="status"
              aria-hidden="true"
            />
          </div>
        </div>
      </Container>
    </section>
  );
};

export default ConfirmEmail;
