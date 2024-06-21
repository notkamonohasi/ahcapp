import { signOut } from "@aws-amplify/auth";
import { faHome, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./Header.css";

const Header = () => {
  return (
    <header className="header">
      <div className="header-container">
        <h1>AHC CodeTest</h1>
        <nav>
          <ul className="header-ul">
            <li className="header-li">
              <a className="header-a" href="/">
                <FontAwesomeIcon icon={faHome} />
                &thinsp; Home
              </a>
            </li>
            <li className="header-li">
              <a className="header-a" href="#">
                About
              </a>
            </li>
            <li className="header-li">
              <a className="header-a" href="#">
                Services
              </a>
            </li>
            <li className="header-li">
              <a
                type="button"
                className="header-a"
                onClick={async () => {
                  await signOut();
                }}
                style={{ cursor: "pointer" }}
              >
                <FontAwesomeIcon icon={faSignOutAlt} />
                &thinsp; SignOut
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
