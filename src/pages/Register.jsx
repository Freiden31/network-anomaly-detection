import Form from "../components/Form";

function Register({onOtpRequest}) {
    return <Form route="/rtnc/user/register/" method="register" onOtpRequest={onOtpRequest} />
}

export default Register;