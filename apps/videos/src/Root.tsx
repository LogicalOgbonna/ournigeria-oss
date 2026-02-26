import { Composition } from "remotion";
import { BudgetOverview } from "./compositions/BudgetOverview";
import { ProductDemo } from "./compositions/ProductDemo/ProductDemo";
import "./styles/global.css";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="ProductDemo"
        component={ProductDemo}
        durationInFrames={750}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="BudgetOverview"
        component={BudgetOverview}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
