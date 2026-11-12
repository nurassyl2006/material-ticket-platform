import React, { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import {
  HelpCircle,
  X,
  PlusCircle,
  MapPin,
  CheckCircle2,
  Wrench,
  Globe,
  ArrowRight,
  Sparkles,
  PhoneCall,
  MessageSquare,
  Mail,
  Edit3,
  Check,
  UserCheck
} from 'lucide-react';

const DEFAULT_SUPPORT_CONTACTS = [
  {
    id: 'nurassyl_main',
    name: 'Nurassyl Maratov',
    roleRu: 'Администратор платформы и координатор заявок',
    roleKk: 'Платформа әкімшісі және өтінімдер үйлестірушісі',
    roleEn: 'Platform Administrator & Operations Support',
    phone: '+7 777 000 0001',
    phoneSecondary: '',
    email: 'n.maratov@ardingly.edu.kz'
  }
];

export const HelpGuideModal = ({ isOpen, onClose, onOpenNewTicket }) => {
  const { lang, role, registeredUsers } = useApp();

  // Default to staff tab for operational workers, or requester tab for teachers/parents/guests
  const isStaffRole = ['it_support', 'cleaning', 'engineer', 'storage_manager', 'workerA', 'facilities_manager'].includes(role);
  const canEditContacts = role === 'director' || role === 'admin';
  const [activeGuideTab, setActiveGuideTab] = useState(isStaffRole ? 'staff' : 'requester');
  const [isEditingContact, setIsEditingContact] = useState(false);

  const [contactInfo, setContactInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('eduops_support_contact_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_SUPPORT_CONTACTS[0];
  });

  // If Nurassyl updated his phone in Staff/Profile, sync it automatically if still using placeholder
  useEffect(() => {
    if (Array.isArray(registeredUsers)) {
      const nurassylUser = registeredUsers.find(
        u =>
          (u.email && (u.email.toLowerCase().includes('maratov') || u.email.toLowerCase().includes('nurassyl'))) ||
          (u.name && u.name.toLowerCase().includes('nurassyl'))
      );
      if (nurassylUser && nurassylUser.phone && nurassylUser.phone.trim() && contactInfo.phone === '+7 777 000 0001') {
        setContactInfo(prev => ({
          ...prev,
          phone: nurassylUser.phone.trim()
        }));
      }
    }
  }, [registeredUsers]);

  useEffect(() => {
    if (isOpen) {
      setActiveGuideTab(isStaffRole ? 'staff' : 'requester');
      setIsEditingContact(false);
    }
  }, [isOpen, isStaffRole]);

  const handleSaveContact = () => {
    try {
      localStorage.setItem('eduops_support_contact_v1', JSON.stringify(contactInfo));
    } catch {
      // ignore
    }
    setIsEditingContact(false);
  };

  if (!isOpen) return null;

  const cleanPhone1 = (contactInfo.phone || '').replace(/[^\d+]/g, '');
  const cleanPhone2 = (contactInfo.phoneSecondary || '').replace(/[^\d+]/g, '');

  const copy = {
    ru: {
      title: 'Помощь, инструкция и контакты',
      subtitle: 'Простая пошаговая инструкция для учителей, родителей и сотрудников',
      tabRequester: '👩‍🏫 Как подать заявку',
      tabStaff: '🛠️ Как выполнять заявки (Службам)',
      contactHeader: '📞 Прямая связь по вопросам и срочным заявкам',
      contactSub: 'Если возникли сложности с сайтом или нужна срочная помощь — позвоните или напишите в WhatsApp:',
      callBtn: 'Позвонить',
      waBtn: 'WhatsApp',
      editBtn: 'Изменить номера',
      saveBtn: 'Сохранить',
      reqSteps: [
        {
          num: '1',
          icon: <Sparkles size={18} color="var(--primary)" />,
          title: 'Выберите нужную службу',
          desc: 'На главной странице нажмите на одну из 4 карточек (IT и техника, Ремонт, Уборка или Канцелярия) либо нажмите синюю кнопку «+ Новая заявка» сверху.'
        },
        {
          num: '2',
          icon: <MapPin size={18} color="var(--primary)" />,
          title: 'Укажите кабинет или зону',
          desc: 'Нажмите на быструю кнопку (Медблок A-1-2, Столовая, Спортзал, Библиотека) или выберите Блок (A, B, C, D) и номер кабинета из списка.'
        },
        {
          num: '3',
          icon: <CheckCircle2 size={18} color="var(--success)" />,
          title: 'Выберите тему и отправьте',
          desc: 'Нажмите на готовую кнопку частой проблемы (например, «Не работает проектор» или «Бумага А4») — название заполнится само! При желании добавьте фото и нажмите «Отправить».'
        }
      ],
      statusTitle: 'Статусы вашей заявки',
      statuses: [
        { badge: 'Ожидает', color: '#d97706', bg: '#fef3c7', text: 'Заявка отправлена и передана нужной службе' },
        { badge: 'В работе', color: '#0369a1', bg: '#e0f2fe', text: 'Специалист принял заявку и уже занимается ей' },
        { badge: 'Выполнено', color: '#15803d', bg: '#dcfce7', text: 'Проблема решена или материалы доставлены в кабинет' }
      ],
      loanTipTitle: '⏱️ Временная выдача на 1–2 урока',
      loanTipDesc: 'Если вы берете маркеры, удлинитель или оборудование на время урока, выберите «На 1–2 урока (с возвратом)». После урока просто нажмите кнопку «Я вернул(а) предмет» в списке своих заявок.',
      staffSteps: [
        {
          num: '1',
          icon: <Wrench size={18} color="var(--primary)" />,
          title: 'Откройте заявку кнопкой «⚡ Принять / Выполнить»',
          desc: 'В разделе «Заявки» вы видите обращения своей службы. Нажмите синюю кнопку на карточке заявки, чтобы открыть окно управления.'
        },
        {
          num: '2',
          icon: <Globe size={18} color="var(--primary)" />,
          title: 'Мгновенный перевод (RU / KK / EN)',
          desc: 'Если иностранный учитель написал заявку на английском, нажмите кнопку 🇷🇺 RU или 🇰🇿 KK вверху окна — текст сразу переведется.'
        },
        {
          num: '3',
          icon: <CheckCircle2 size={18} color="var(--success)" />,
          title: 'Примите в работу и закройте по готовности',
          desc: 'Нажмите «Принять в работу», когда идете в кабинет. После выполнения напишите краткий комментарий, при желании прикрепите фото результата и нажмите зеленую кнопку «✓ Выполнено».'
        }
      ],
      transferTipTitle: '🔄 Заявка попала не в ваш отдел?',
      transferTipDesc: 'Внизу окна обработки заявки нажмите «Не ваш профиль? Перенаправить в другую службу» и выберите нужную команду — заявка сразу перейдет к ним.',
      tryNowBtn: 'Подать заявку сейчас',
      closeBtn: 'Понятно, закрыть'
    },
    kk: {
      title: 'Көмек, нұсқаулық және байланыс',
      subtitle: 'Мұғалімдер, ата-аналар және қызметкерлерге арналған қарапайым нұсқаулық',
      tabRequester: '👩‍🏫 Өтінім қалай беріледі',
      tabStaff: '🛠️ Өтінімді орындау (Қызметкерлерге)',
      contactHeader: '📞 Тікелей байланыс және жедел көмек',
      contactSub: 'Егер сайт бойынша сұрақ туындаса немесе жедел көмек қажет болса, қоңырау шалыңыз немесе WhatsApp-қа жазыңыз:',
      callBtn: 'Қоңырау шалу',
      waBtn: 'WhatsApp',
      editBtn: 'Нөмірді өзгерту',
      saveBtn: 'Сақтау',
      reqSteps: [
        {
          num: '1',
          icon: <Sparkles size={18} color="var(--primary)" />,
          title: 'Қажетті қызметті таңдаңыз',
          desc: 'Басты беттегі 4 карточканың бірін (IT, Жөндеу, Тазалық немесе Қойма) немесе жоғарыдағы «+ Жаңа өтінім» батырмасын басыңыз.'
        },
        {
          num: '2',
          icon: <MapPin size={18} color="var(--primary)" />,
          title: 'Кабинетті немесе аймақты көрсетіңіз',
          desc: 'Дайын батырманы басыңыз (Медблок A-1-2, Асхана, Спортзал, Кітапхана) немесе Блок пен кабинет нөмірін тізімнен таңдаңыз.'
        },
        {
          num: '3',
          icon: <CheckCircle2 size={18} color="var(--success)" />,
          title: 'Мәселені таңдап, жіберіңіз',
          desc: 'Жиі кездесетін мәселе батырмасын бассаңыз, атауы автоматты түрде толтырылады. Қажет болса фото қосып, «Жіберу» батырмасын басыңыз.'
        }
      ],
      statusTitle: 'Өтінім мәртебелері',
      statuses: [
        { badge: 'Күтілуде', color: '#d97706', bg: '#fef3c7', text: 'Өтінім жіберілді және тиісті бөлімге түсті' },
        { badge: 'Орындалуда', color: '#0369a1', bg: '#e0f2fe', text: 'Маман өтінімді қабылдап, жұмысқа кірісті' },
        { badge: 'Орындалды', color: '#15803d', bg: '#dcfce7', text: 'Мәселе шешілді немесе заттар кабинетке жеткізілді' }
      ],
      loanTipTitle: '⏱️ 1–2 сабаққа уақытша алу',
      loanTipDesc: 'Егер затты сабақ уақытына ғана алсаңыз, «1–2 сабаққа (қайтарумен)» таңдаңыз. Сабақтан соң өтінім карточкасындағы «Қайтардым» батырмасын басыңыз.',
      staffSteps: [
        {
          num: '1',
          icon: <Wrench size={18} color="var(--primary)" />,
          title: '«⚡ Қабылдау / Орындау» батырмасын басыңыз',
          desc: '«Өтінімдер» бөлімінде өз бөліміңіздің өтінімдерін көресіз. Карточкадағы көк батырманы басып, басқару терезесін ашыңыз.'
        },
        {
          num: '2',
          icon: <Globe size={18} color="var(--primary)" />,
          title: 'Автоматты аударма (RU / KK / EN)',
          desc: 'Егер өтінім ағылшын тілінде жазылса, терезенің жоғарғы жағындағы 🇰🇿 KK немесе 🇷🇺 RU батырмасын басып, бірден аударып оқыңыз.'
        },
        {
          num: '3',
          icon: <CheckCircle2 size={18} color="var(--success)" />,
          title: 'Жұмысқа қабылдаңыз және аяқтаңыз',
          desc: 'Алдымен «Жұмысқа қабылдау» батырмасын басыңыз. Жұмыс біткен соң қысқаша түсініктеме мен фото қосып, жасыл «✓ Орындалды» батырмасын басыңыз.'
        }
      ],
      transferTipTitle: '🔄 Өтінім басқа бөлімге тиесілі ме?',
      transferTipDesc: 'Терезенің төменгі жағындағы «Басқа бөлімге бағыттау» түймесін басып, қажетті қызметті таңдаңыз.',
      tryNowBtn: 'Қазір өтінім беру',
      closeBtn: 'Түсінікті, жабу'
    },
    en: {
      title: 'Help Guide & Direct Contacts',
      subtitle: 'Quick step-by-step guide for teachers, parents, and campus staff',
      tabRequester: '👩‍🏫 How to Submit a Request',
      tabStaff: '🛠️ How to Process Tickets (Staff)',
      contactHeader: '📞 Direct Support & Urgent Assistance',
      contactSub: 'If you have any questions or need urgent assistance with a request, call or message directly on WhatsApp:',
      callBtn: 'Call',
      waBtn: 'WhatsApp',
      editBtn: 'Edit Numbers',
      saveBtn: 'Save',
      reqSteps: [
        {
          num: '1',
          icon: <Sparkles size={18} color="var(--primary)" />,
          title: 'Choose the Service',
          desc: 'On the dashboard, click one of the 4 big service cards (IT & Tech, Repairs, Cleaning, or Supplies) or click the blue "+ New Request" button.'
        },
        {
          num: '2',
          icon: <MapPin size={18} color="var(--primary)" />,
          title: 'Select Your Room or Area',
          desc: 'Click a quick popular chip (Medical Block A-1-2, Library, Dining Hall, Sports Hall) or pick your Block (A, B, C, D) and Room number from the 2 simple dropdowns.'
        },
        {
          num: '3',
          icon: <CheckCircle2 size={18} color="var(--success)" />,
          title: 'Pick Common Issue & Submit',
          desc: 'Click any quick-select problem pill (e.g., "Projector not working" or "A4 Paper") to auto-fill the title. Optionally add a photo and click Submit!'
        }
      ],
      statusTitle: 'Understanding Request Statuses',
      statuses: [
        { badge: 'Pending', color: '#d97706', bg: '#fef3c7', text: 'Sent to the department team and waiting to be picked up' },
        { badge: 'In Progress', color: '#0369a1', bg: '#e0f2fe', text: 'A specialist has accepted your request and is working on it' },
        { badge: 'Completed', color: '#15803d', bg: '#dcfce7', text: 'Resolved and verified, or supplies delivered to your room' }
      ],
      loanTipTitle: '⏱️ Borrowing Items for 1–2 Lessons',
      loanTipDesc: 'When ordering equipment or supplies you only need temporarily, select "Borrow (1–2 Lessons)". After class, click "I Have Returned This Item" on your request card.',
      staffSteps: [
        {
          num: '1',
          icon: <Wrench size={18} color="var(--primary)" />,
          title: 'Click "⚡ Accept & Process" on any Ticket',
          desc: 'In the Requests tab, click the blue action button on a ticket card to open the clean processing window.'
        },
        {
          num: '2',
          icon: <Globe size={18} color="var(--primary)" />,
          title: 'One-Click Translation (RU / KK / EN)',
          desc: 'Switch between Russian, Kazakh, and English at the top of the ticket window, or translate your resolution note back into English for the teacher.'
        },
        {
          num: '3',
          icon: <CheckCircle2 size={18} color="var(--success)" />,
          title: 'Accept Work, then Mark Completed',
          desc: 'Click "Accept & Start Work" when heading out. Once finished, add a short note or completion photo and click the green "✓ Mark Completed" button.'
        }
      ],
      transferTipTitle: '🔄 Wrong Department?',
      transferTipDesc: 'Click "Wrong department? Transfer ticket to another team" at the bottom of the ticket window to forward it with one click.',
      tryNowBtn: 'Create a Request Now',
      closeBtn: 'Got it, close'
    }
  };

  const c = copy[lang] || copy.en;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="fluent-card animate-fade-in modal-dialog-responsive"
        style={{
          width: '100%',
          maxWidth: '640px',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '24px 26px',
          boxShadow: 'var(--shadow-depth-16)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'var(--primary-tint)',
              border: '1px solid rgba(37, 99, 235, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <HelpCircle size={22} color="var(--primary)" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'var(--text-main)', letterSpacing: '-0.2px' }}>
                {c.title}
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                {c.subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <X size={17} />
          </button>
        </div>

        {/* ── DIRECT CONTACT CARD FOR NURASSYL ────────────────────────────── */}
        <div style={{
          background: 'var(--primary-tint)',
          border: '1.5px solid rgba(37, 99, 235, 0.28)',
          borderRadius: '14px',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--primary)', marginBottom: '2px' }}>
                {c.contactHeader}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                {c.contactSub}
              </div>
            </div>

            {canEditContacts && (
              <button
                type="button"
                onClick={() => isEditingContact ? handleSaveContact() : setIsEditingContact(true)}
                style={{
                  background: isEditingContact ? 'var(--success)' : 'var(--bg-card)',
                  color: isEditingContact ? '#ffffff' : 'var(--primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {isEditingContact ? <Check size={13} /> : <Edit3 size={12} />}
                <span>{isEditingContact ? c.saveBtn : c.editBtn}</span>
              </button>
            )}
          </div>

          {isEditingContact ? (
            <div className="modal-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'var(--bg-card)', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div>
                <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                  Primary Phone / WhatsApp
                </label>
                <input
                  type="text"
                  value={contactInfo.phone}
                  onChange={e => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+7 7XX XXX XXXX"
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '12px', background: 'var(--bg-input)', color: 'var(--text-main)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                  Second Phone (Optional)
                </label>
                <input
                  type="text"
                  value={contactInfo.phoneSecondary || ''}
                  onChange={e => setContactInfo(prev => ({ ...prev, phoneSecondary: e.target.value }))}
                  placeholder="+7 7XX XXX XXXX"
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '12px', background: 'var(--bg-input)', color: 'var(--text-main)' }}
                />
              </div>
            </div>
          ) : (
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'var(--primary)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '13px',
                  flexShrink: 0
                }}>
                  NM
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{contactInfo.name}</span>
                    <UserCheck size={13} color="var(--primary)" />
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {lang === 'ru' ? contactInfo.roleRu : lang === 'kk' ? contactInfo.roleKk : contactInfo.roleEn}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary)', marginTop: '2px' }}>
                    {contactInfo.phone}
                    {contactInfo.phoneSecondary ? ` • ${contactInfo.phoneSecondary}` : ''}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {cleanPhone1 && (
                  <>
                    <a
                      href={`tel:${cleanPhone1}`}
                      style={{
                        background: 'var(--primary)',
                        color: '#ffffff',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '700',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        textDecoration: 'none'
                      }}
                    >
                      <PhoneCall size={13} />
                      <span>{c.callBtn}</span>
                    </a>
                    <a
                      href={`https://wa.me/${cleanPhone1.replace('+', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: '#10b981',
                        color: '#ffffff',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '700',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        textDecoration: 'none'
                      }}
                    >
                      <MessageSquare size={13} />
                      <span>{c.waBtn}</span>
                    </a>
                  </>
                )}
                {cleanPhone2 && (
                  <a
                    href={`tel:${cleanPhone2}`}
                    style={{
                      background: 'var(--bg-subtle)',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border-color)',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      textDecoration: 'none'
                    }}
                  >
                    <PhoneCall size={12} />
                    <span>{contactInfo.phoneSecondary}</span>
                  </a>
                )}
                <a
                  href={`mailto:${contactInfo.email}`}
                  title={contactInfo.email}
                  style={{
                    background: 'var(--bg-subtle)',
                    color: 'var(--text-main)',
                    border: '1px solid var(--border-color)',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    textDecoration: 'none'
                  }}
                >
                  <Mail size={13} />
                  <span>Email</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Segmented Tab Switcher: Teachers/Parents vs Staff */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px',
          background: 'var(--bg-subtle)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)'
        }}>
          <button
            type="button"
            onClick={() => setActiveGuideTab('requester')}
            style={{
              padding: '9px 12px',
              borderRadius: '9px',
              border: 'none',
              background: activeGuideTab === 'requester' ? 'var(--primary)' : 'transparent',
              color: activeGuideTab === 'requester' ? '#ffffff' : 'var(--text-main)',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {c.tabRequester}
          </button>
          <button
            type="button"
            onClick={() => setActiveGuideTab('staff')}
            style={{
              padding: '9px 12px',
              borderRadius: '9px',
              border: 'none',
              background: activeGuideTab === 'staff' ? 'var(--primary)' : 'transparent',
              color: activeGuideTab === 'staff' ? '#ffffff' : 'var(--text-main)',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {c.tabStaff}
          </button>
        </div>

        {/* TAB 1: FOR TEACHERS, PARENTS & VISITORS */}
        {activeGuideTab === 'requester' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* 3 Numbered Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {c.reqSteps.map((step) => (
                <div
                  key={step.num}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '11px 14px'
                  }}
                >
                  <div style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '1px'
                  }}>
                    {step.num}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      {step.icon}
                      <span>{step.title}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                      {step.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Statuses Legend */}
            <div style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '11px 14px'
            }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                {c.statusTitle}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {c.statuses.map((st, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
                    <span style={{
                      background: st.bg,
                      color: st.color,
                      fontWeight: '700',
                      fontSize: '11px',
                      padding: '2px 9px',
                      borderRadius: '6px',
                      minWidth: '88px',
                      textAlign: 'center',
                      flexShrink: 0
                    }}>
                      {st.badge}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>{st.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FOR STAFF & DEPARTMENT SPECIALISTS */}
        {activeGuideTab === 'staff' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {c.staffSteps.map((step) => (
                <div
                  key={step.num}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '11px 14px'
                  }}
                >
                  <div style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '1px'
                  }}>
                    {step.num}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      {step.icon}
                      <span>{step.title}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                      {step.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Transfer Tip */}
            <div style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '11px 14px',
              fontSize: '12px',
              lineHeight: 1.45
            }}>
              <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '2px' }}>
                {c.transferTipTitle}
              </strong>
              <span style={{ color: 'var(--text-muted)' }}>{c.transferTipDesc}</span>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '12px', gap: '10px', flexWrap: 'wrap' }}>
          {onOpenNewTicket && activeGuideTab === 'requester' ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenNewTicket();
              }}
              className="fluent-btn-primary"
              style={{ height: '38px', padding: '0 16px', borderRadius: '10px', fontSize: '12.5px', fontWeight: '700' }}
            >
              <PlusCircle size={15} />
              <span>{c.tryNowBtn}</span>
              <ArrowRight size={14} />
            </button>
          ) : <div />}

          <button
            type="button"
            onClick={onClose}
            className="fluent-btn-secondary"
            style={{ height: '38px', padding: '0 18px', borderRadius: '10px', fontSize: '12.5px', fontWeight: '600', marginLeft: 'auto' }}
          >
            {c.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpGuideModal;
