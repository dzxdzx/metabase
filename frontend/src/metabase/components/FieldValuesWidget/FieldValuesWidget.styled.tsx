import styled from "@emotion/styled";
import Ellipsified from "metabase/core/components/Ellipsified";

export const StyledEllipsified = styled(Ellipsified)`
  font-weight: bold;
  display: inline-block;
`;

const OptionsMessageContainer = styled.div`
  padding: 2rem;

  position: relative;

  display: flex;
  align-items: center;
  justify-content: center;

  white-space: nowrap;
`;

export const OptionsMessage = ({ message }: { message: string }) => (
  <OptionsMessageContainer>{message}</OptionsMessageContainer>
);
