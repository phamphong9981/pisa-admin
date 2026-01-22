// Third-party Imports
import styled from '@emotion/styled'

// Config Imports
import themeConfig from '@configs/themeConfig'

type StyledMainProps = {
  isContentCompact: boolean
  isNavToggled?: boolean
}

const StyledMain = styled.main<StyledMainProps>`
  padding: ${({ isNavToggled }) => (isNavToggled ? 0 : themeConfig.layoutPadding)}px;
  ${({ isContentCompact, isNavToggled }) =>
    isContentCompact &&
    !isNavToggled &&
    `
    margin-inline: auto;
    max-inline-size: ${themeConfig.compactContentWidth}px;
  `}
  ${({ isNavToggled }) =>
    isNavToggled &&
    `
    width: 100%;
    max-width: 100%;
  `}
`

export default StyledMain
