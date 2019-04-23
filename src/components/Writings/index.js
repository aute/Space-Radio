import React, { Component } from "react";
import styles from "./styles.module.css";

class Writings extends Component {
  constructor(props) {
    super(props);
    this.state = {
      type: ""
    };
  }
  componentDidMount() {}
  onBack = () => {
    this.props.onBack();
  };
  render() {
    return (
      <div className={styles.Writings_wapper}>
        <div className={styles.Writings}>
          <div className={styles.article_content}>
            <article>
              <section>
                <h1>故事</h1>
                <p>
                  <a href="http://www.ariss.org/" target="_blank">
                    ARISS
                  </a>{" "}
                  国际空间站业余无线电台，带来最初地启发。无论是科技抑或太空本身的魅力，还是对于「等待」、「孤独」以及「不确定性」的感受和思考，都让我们为之着迷。
                </p>
                <p>
                  所以这个简单网站诞生。利用空间站位置信息接口、稳定且高效的现代通讯网络，模拟{" "}
                  <em>早期人造卫星</em> 工作。
                </p>
                <p>
                  <dfn>
                    <em>早期人造卫星</em>
                    ，第一颗人造卫星于1957年10月4日于苏联发射升空，那个时期的人造卫星只能进行简单的无线电发射及中转，详情见：
                    <a
                      href="https://zh.wikipedia.org/wiki/%E5%8F%B2%E6%99%AE%E5%B0%BC%E5%85%8B1%E8%99%9F"
                      target="_blank"
                    >
                      斯普特尼克1号
                    </a>
                  </dfn>
                </p>
                <p>另外，林盛文设计并制作收音机实体版本：</p>
                <img src="radio.jpeg" alt="radio" width="100%" />
              </section>
              <section>
                <h1>团队</h1>
                <div className={styles.team}>
                  <div>
                    <h2>林盛文</h2>
                    <p>
                      奥斯陆建筑与设计学院，多媒体艺术
                      <br />
                      硕士在读
                    </p>
                    <p>邮箱：XXXXX</p>
                    <p>ins等社交网络链接 icon</p>
                  </div>
                  <div>
                    <h2>敖特</h2>
                    <p>
                      某科技公司，前端开发 & 用户体验
                      <br />
                      研发经理
                    </p>
                    <p>邮箱：no.at@live.com</p>
                    <p>ins等社交网络链接 icon</p>
                  </div>
                </div>
              </section>
              <section>
                <h1>其他</h1>
                <p>
                  -
                  由于挪威与中国之间距离遥远，超过理论所能覆盖最大通讯范围，因此林盛文与敖特从未通过他们的网站取得联系
                </p>
              </section>
            </article>
          </div>
          <h1
            style={{ textAlign: "right", cursor: "pointer", margin: '1rem 0' }}
            onClick={this.onBack}
          >{`<-`}</h1>
        </div>
      </div>
    );
  }
}

export default Writings;
