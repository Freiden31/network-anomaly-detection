import Form from "../components/Form";

function Login({ onForgotPassword }) {
    return <Form route="/rtnc/token/" method="login" onForgotPassword={onForgotPassword} />
}

export default Login