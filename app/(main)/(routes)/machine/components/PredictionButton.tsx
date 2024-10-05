import React from "react";
import { Button } from "@chakra-ui/react";

interface PredictionButtonProps {
  isLoading: boolean;
  onClickPredict: () => void;
  model: any;
}

const PredictionButton: React.FC<PredictionButtonProps> = ({
  isLoading,
  onClickPredict,
  model,
}) => (
  <Button
    isLoading={isLoading}
    loadingText="Calculating"
    colorScheme="teal"
    onClick={onClickPredict}
    isDisabled={!model}
  >
    Check Simple Overview Yearly Financial Health
  </Button>
);

export default PredictionButton;
