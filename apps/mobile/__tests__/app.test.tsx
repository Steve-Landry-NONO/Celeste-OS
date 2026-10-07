import { render } from "@testing-library/react-native";

jest.mock("react-native-safe-area-context", () => jest.requireActual("react-native-safe-area-context/jest/mock").default);
jest.mock("../src/config", () => ({ readMobileConfig: () => null }));
import App from "../App";

describe("mobile fail-closed state", () => {
  test("never asks for credentials without a publishable configuration", async () => {
    const screen = await render(<App/>);
    expect(screen.getByText("Connexion à préparer")).toBeTruthy();
    expect(screen.queryByLabelText("Mot de passe")).toBeNull();
  });
});
