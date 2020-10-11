/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');

const CompLibrary = require('../../core/CompLibrary');
const Container = CompLibrary.Container;
const GridBlock = CompLibrary.GridBlock;

const CWD = process.cwd();

const siteConfig = require(CWD + '/siteConfig.js');
const versions = require(CWD + '/versions.json');

class Versions extends React.Component {
  render() {
    const latestVersion = versions[0];
    return (
      <div className="docMainWrapper wrapper">
        <Container className="mainContainer versionsContainer">
          <div className="post">
            <header className="postHeader">
              <h2>{siteConfig.title + ' Versions'}</h2>
            </header>
            <h3 id="latest">Current version (Stable)</h3>
            <table className="versions">
              <tbody>
                <tr>
                  <th>{latestVersion}</th>
                  <td>
                    <a
                      href={`${siteConfig.baseUrl}docs/en/getting-started.html`}
                    >
                      Documentation
                    </a>
                  </td>
                  <td>
                    <a
                      href={`https://github.com/KnisterPeter/tsdi/releases/tag/v${latestVersion}`}
                    >
                      Release Notes
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
            <h3 id="rc">Latest Version</h3>
            <table className="versions">
              <tbody>
                <tr>
                  <th>master</th>
                  <td>
                    <a
                      href={`${siteConfig.baseUrl}docs/en/next/getting-started.html`}
                    >
                      Documentation
                    </a>
                  </td>
                  <td>
                    <a href="https://github.com/KnisterPeter/tsdi">
                      Source Code
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
            <h3 id="archive">Past Versions</h3>
            <table className="versions">
              <tbody>
                {versions.map(
                  (version) =>
                    version !== latestVersion && (
                      <tr key={version}>
                        <th>{version}</th>
                        <td>
                          <a
                            href={`${siteConfig.baseUrl}docs/en/${version}/getting-started.html`}
                          >
                            Documentation
                          </a>
                        </td>
                        <td>
                          <a
                            href={`https://github.com/KnisterPeter/tsdi/releases/tag/v${version}`}
                          >
                            Release Notes
                          </a>
                        </td>
                      </tr>
                    )
                )}
              </tbody>
            </table>
            <p>
              You can find past versions of this project{' '}
              <a href="https://github.com/KnisterPeter/tsdi/releases">
                {' '}
                on GitHub{' '}
              </a>
              .
            </p>
          </div>
        </Container>
      </div>
    );
  }
}

module.exports = Versions;
